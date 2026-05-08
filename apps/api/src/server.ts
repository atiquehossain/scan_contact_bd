import bcrypt from "bcryptjs";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { createHmac, createSign } from "node:crypto";
import QRCode from "qrcode";
import { z } from "zod";
import {
  AbuseReportStatus,
  CallSessionStatus,
  CallSignalSender,
  ContactMessageSender,
  ContactReason,
  ContactRequestStatus,
  Language,
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ProductType,
  QrTagStatus,
  QrTagType,
  ResellerBatchStatus,
  ResellerStatus,
  RoleName,
  SocietyMemberRole,
  UserStatus,
  VisitorStatus
} from "@prisma/client";
import { env, isLocalDevelopment, isProduction } from "./lib/env.js";
import { normalizeBangladeshPhone } from "./lib/phone.js";
import {
  createPublicSlug,
  generateOtp,
  hashNetworkValue,
  hashRefreshToken,
  hmac,
  randomToken,
  signAccessToken,
  verifyAccessToken
} from "./lib/security.js";
import { DevLogOtpProvider, ManualCodProvider, OtpProvider, PaymentProvider, PlaceholderPaymentProvider, SmsGatewayOtpProvider } from "./lib/providers.js";
import { prisma } from "./lib/prisma.js";
import {
  conversationExpiredResponse,
  conversationUnavailableResponse,
  expiredConversationPatch,
  hashConversationToken,
  isConversationExpired,
  isConversationReplyAllowed,
  nextConversationDeleteAt,
  nextConversationExpiry
} from "./lib/conversation.js";

type AuthUser = {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  roles: RoleName[];
};

type AuthedRequest = Request & { user?: AuthUser };

const otpProvider: OtpProvider = env.otpProvider === "sms-gateway" ? new SmsGatewayOtpProvider() : new DevLogOtpProvider();
const paymentProviders: Record<PaymentMethod, PaymentProvider> = {
  COD: new ManualCodProvider(),
  BKASH: new PlaceholderPaymentProvider("bkash"),
  NAGAD: new PlaceholderPaymentProvider("nagad"),
  ROCKET: new PlaceholderPaymentProvider("rocket"),
  SSLCOMMERZ: new PlaceholderPaymentProvider("sslcommerz"),
  MANUAL: new ManualCodProvider()
};

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" }
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
morgan.token("safe-url", (req) => {
  const expressReq = req as Request;
  const url = expressReq.originalUrl || expressReq.url || "";
  return url.replace(/([?&]token=)[^&]+/gi, "$1[redacted]");
});
app.use(
  morgan(
    isProduction
      ? ':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
      : ":method :safe-url :status :response-time ms - :res[content-length]"
  )
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(Object.assign(new Error("Origin is not allowed"), { statusCode: 403 }));
    },
    credentials: true
  })
);

const publicContactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many public requests. Please wait before trying again." });
  }
});

const publicOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many order attempts. Please wait before trying again." });
  }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many OTP requests. Please wait before trying again." });
  }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many OTP verification attempts. Please wait before trying again." });
  }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many admin login attempts. Please wait before trying again." });
  }
});

const pinLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many PIN login attempts. Please wait before trying again." });
  }
});

const privateResponseKeys = new Set(["passwordHash", "pinHash"]);
const accessCookieName = "scancontact_access";
const refreshCookieName = "scancontact_refresh";

function isPrivateResponseKey(key: string) {
  return privateResponseKeys.has(key) || key.endsWith("Hash");
}

function sanitizePrivateFields(value: unknown, seen = new WeakSet<object>()): unknown {
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return value;
  if (seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    const sanitizedArray = value.map((entry) => sanitizePrivateFields(entry, seen));
    seen.delete(value);
    return sanitizedArray;
  }
  const sanitized = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isPrivateResponseKey(key))
      .map(([key, entry]) => [key, sanitizePrivateFields(entry, seen)])
  );
  seen.delete(value);
  return sanitized;
}

function readCookie(req: Request, name: string) {
  const raw = req.headers.cookie || "";
  const match = raw
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));
  if (!match) return "";
  return decodeURIComponent(match.slice(name.length + 1));
}

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string; expiresAt: Date }) {
  const common = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/"
  };
  res.cookie(accessCookieName, tokens.accessToken, { ...common, maxAge: 30 * 60 * 1000 });
  res.cookie(refreshCookieName, tokens.refreshToken, { ...common, expires: tokens.expiresAt });
}

function clearAuthCookies(res: Response) {
  const common = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/"
  };
  res.clearCookie(accessCookieName, common);
  res.clearCookie(refreshCookieName, common);
}

function adminRedirectBase(req: Request) {
  const referer = req.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const allowed = new Set(env.corsOrigins);
      allowed.add(env.appUrl.replace(/\/$/, ""));
      if (allowed.has(url.origin)) return url.origin;
    } catch {
      // Fall back to configured app URL.
    }
  }
  return env.appUrl.replace(/\/$/, "");
}

app.use((_req, res, next) => {
  const json = res.json.bind(res);
  res.json = ((body?: unknown) => json(sanitizePrivateFields(body))) as Response["json"];
  next();
});

function asyncRoute(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

function parseBody<T>(schema: z.ZodType<T>, req: Request): T {
  return schema.parse(req.body);
}

function shortId(value?: string | null): string {
  if (!value) return "none";
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function maskPhone(phone?: string | null): string {
  if (!phone) return "none";
  if (phone.length <= 7) return "***";
  return `${phone.slice(0, 7)}****${phone.slice(-3)}`;
}

function maskEmail(email?: string | null): string {
  if (!email) return "none";
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  const visibleName = name.length <= 2 ? `${name[0] || "*"}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${visibleName}@${domain}`;
}

function safeRequestPath(req: Request) {
  const url = req.originalUrl || req.url || "";
  return url.replace(/([?&]token=)[^&]+/gi, "$1[redacted]");
}

function debugLog(area: string, fields: Record<string, unknown> = {}) {
  if (isProduction) return;
  const details = Object.entries(fields)
    .map(([key, value]) => {
      if (value instanceof Date) return `${key}=${value.toISOString()}`;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return `${key}=${value}`;
      return `${key}=${JSON.stringify(value)}`;
    })
    .join(" ");
  console.info(`[ScanContact Debug] ${area}${details ? ` ${details}` : ""}`);
}

type OwnerPushPayload = {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean | null | undefined>;
};

let fcmAccessTokenCache: { token: string; expiresAtMs: number } | null = null;

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function pushData(data: OwnerPushPayload["data"] = {}) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
}

function fcmConfigured() {
  return Boolean(env.fcmProjectId && env.fcmClientEmail && env.fcmPrivateKey);
}

async function getFcmAccessToken() {
  if (!fcmConfigured()) return null;
  if (fcmAccessTokenCache && fcmAccessTokenCache.expiresAtMs > Date.now() + 60_000) {
    return fcmAccessTokenCache.token;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const unsignedJwt = [
    base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    base64Url(
      JSON.stringify({
        iss: env.fcmClientEmail,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: issuedAt,
        exp: issuedAt + 3600
      })
    )
  ].join(".");
  const signature = createSign("RSA-SHA256").update(unsignedJwt).sign(env.fcmPrivateKey);
  const assertion = `${unsignedJwt}.${base64Url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    debugLog("push.fcm.accessToken.failed", { status: response.status });
    return null;
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  fcmAccessTokenCache = {
    token: data.access_token,
    expiresAtMs: Date.now() + Math.max((data.expires_in ?? 3600) - 120, 60) * 1000
  };
  return data.access_token;
}

async function disableDeviceToken(deviceId: string, reason: string) {
  await prisma.deviceToken.updateMany({
    where: { id: deviceId },
    data: { enabled: false, deletedAt: new Date() }
  });
  debugLog("push.fcm.deviceDisabled", { deviceId: shortId(deviceId), reason });
}

async function sendOwnerPush(userId: string, payload: OwnerPushPayload) {
  const devices = await prisma.deviceToken.findMany({
    where: { userId, provider: "fcm", enabled: true, deletedAt: null },
    select: { id: true, token: true, platform: true }
  });

  if (!devices.length) {
    debugLog("push.fcm.skip", { ownerId: shortId(userId), reason: "no_fcm_devices" });
    return;
  }
  if (!fcmConfigured()) {
    debugLog("push.fcm.skip", { ownerId: shortId(userId), reason: "not_configured", deviceCount: devices.length });
    return;
  }

  const accessToken = await getFcmAccessToken();
  if (!accessToken) {
    debugLog("push.fcm.skip", { ownerId: shortId(userId), reason: "access_token_unavailable", deviceCount: devices.length });
    return;
  }

  await Promise.allSettled(
    devices.map(async (device) => {
      try {
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(env.fcmProjectId)}/messages:send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: {
              token: device.token,
              notification: { title: payload.title, body: payload.body },
              data: pushData(payload.data),
              android: {
                priority: "HIGH"
              }
            }
          })
        });

        if (response.ok) {
          debugLog("push.fcm.sent", { ownerId: shortId(userId), deviceId: shortId(device.id), platform: device.platform });
          return;
        }

        const errorText = await response.text();
        debugLog("push.fcm.failed", {
          ownerId: shortId(userId),
          deviceId: shortId(device.id),
          status: response.status,
          error: errorText.slice(0, 160)
        });
        if (response.status === 404 || errorText.includes("UNREGISTERED") || errorText.includes("registration-token-not-registered")) {
          await disableDeviceToken(device.id, "unregistered");
        }
      } catch (error) {
        debugLog("push.fcm.failed", {
          ownerId: shortId(userId),
          deviceId: shortId(device.id),
          error: error instanceof Error ? error.message : "unknown_error"
        });
      }
    })
  );
}

type ConversationLifecycleRecord = {
  id: string;
  status: ContactRequestStatus;
  expiresAt: Date | null;
  expiredAt: Date | null;
  deleteAt: Date | null;
};

async function expireConversationIfNeeded<T extends ConversationLifecycleRecord>(
  contactRequest: T,
  now = new Date()
) {
  if (!isConversationExpired(contactRequest, now)) {
    return { contactRequest, expired: false };
  }
  const patch = expiredConversationPatch(contactRequest, now);
  const updated = await prisma.contactRequest.update({
    where: { id: contactRequest.id },
    data: patch
  });
  return {
    contactRequest: { ...contactRequest, ...updated },
    expired: true
  };
}

async function expireInactiveConversationsForOwner(ownerId: string) {
  await prisma.$executeRaw`
    UPDATE "ContactRequest"
    SET
      "status" = 'EXPIRED'::"ContactRequestStatus",
      "expiredAt" = COALESCE("expiredAt", "expiresAt", NOW()),
      "deleteAt" = COALESCE("deleteAt", COALESCE("expiredAt", "expiresAt", NOW()) + INTERVAL '10 days')
    WHERE "ownerId" = ${ownerId}
      AND "status" = 'OPEN'::"ContactRequestStatus"
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" < NOW()
      AND "deletedAt" IS NULL
  `;
}

function sendConversationExpired(res: Response) {
  return res.status(410).json(conversationExpiredResponse);
}

function sendConversationUnavailable(res: Response) {
  return res.status(404).json(conversationUnavailableResponse);
}

async function validateScannerConversation(id: string, token: string) {
  const tokenHash = hashConversationToken(token);
  const contactRequest = await prisma.contactRequest.findFirst({
    where: { id, replyTokenHash: tokenHash, deletedAt: null },
    include: {
      qrTag: true,
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" }
      }
    }
  });
  if (!contactRequest) return { result: "unavailable" as const, contactRequest: null };
  const lifecycle = await expireConversationIfNeeded(contactRequest);
  if (lifecycle.expired || lifecycle.contactRequest.status === ContactRequestStatus.EXPIRED) {
    return { result: "expired" as const, contactRequest: lifecycle.contactRequest };
  }
  if (lifecycle.contactRequest.status !== ContactRequestStatus.OPEN) {
    return { result: "unavailable" as const, contactRequest: lifecycle.contactRequest };
  }
  if (!isPublicTagActive(lifecycle.contactRequest.qrTag)) {
    return { result: "unavailable" as const, contactRequest: lifecycle.contactRequest };
  }
  return { result: "active" as const, contactRequest: lifecycle.contactRequest };
}

type CallLifecycleRecord = {
  id: string;
  status: CallSessionStatus;
  expiresAt: Date;
};

type IceServerDto = {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: "password";
};

function nextCallRingExpiry(now = new Date()) {
  return new Date(now.getTime() + 90 * 1000);
}

function nextCallActiveExpiry(now = new Date()) {
  return new Date(now.getTime() + 30 * 60 * 1000);
}

function hashCallToken(token: string) {
  return hmac(`call:${token}`);
}

function splitIceUrls(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function iceUrls(urls: string[]) {
  return urls.length === 1 ? urls[0] : urls;
}

function configuredIceServers(now = new Date()): IceServerDto[] {
  const servers: IceServerDto[] = [];
  const stunUrls = splitIceUrls(env.webrtcStunUrls);
  const turnUrls = splitIceUrls(env.webrtcTurnUrls);

  if (stunUrls.length) {
    servers.push({ urls: iceUrls(stunUrls) });
  }

  if (!turnUrls.length) {
    return servers;
  }

  if (env.webrtcTurnSharedSecret) {
    const ttlSeconds =
      Number.isFinite(env.webrtcTurnTtlSeconds) && env.webrtcTurnTtlSeconds > 0 ? env.webrtcTurnTtlSeconds : 3600;
    const expiresAt = Math.floor(now.getTime() / 1000) + ttlSeconds;
    const username = `${expiresAt}:scancontact`;
    const credential = createHmac("sha1", env.webrtcTurnSharedSecret).update(username).digest("base64");
    servers.push({ urls: iceUrls(turnUrls), username, credential, credentialType: "password" });
    return servers;
  }

  if (env.webrtcTurnUsername && env.webrtcTurnCredential) {
    servers.push({
      urls: iceUrls(turnUrls),
      username: env.webrtcTurnUsername,
      credential: env.webrtcTurnCredential,
      credentialType: "password"
    });
  }

  return servers;
}

function isCallTerminal(status: CallSessionStatus) {
  return (
    status === CallSessionStatus.DECLINED ||
    status === CallSessionStatus.ENDED ||
    status === CallSessionStatus.EXPIRED ||
    status === CallSessionStatus.FAILED
  );
}

async function expireCallIfNeeded<T extends CallLifecycleRecord>(callSession: T, now = new Date()) {
  if (isCallTerminal(callSession.status) || callSession.expiresAt >= now) {
    return { callSession, expired: false };
  }
  const updated = await prisma.callSession.update({
    where: { id: callSession.id },
    data: { status: CallSessionStatus.EXPIRED, endedAt: now }
  });
  return { callSession: { ...callSession, ...updated }, expired: true };
}

async function expireInactiveCallsForOwner(ownerId: string) {
  await prisma.callSession.updateMany({
    where: {
      ownerId,
      deletedAt: null,
      status: { in: [CallSessionStatus.RINGING, CallSessionStatus.ACCEPTED] },
      expiresAt: { lt: new Date() }
    },
    data: { status: CallSessionStatus.EXPIRED, endedAt: new Date() }
  });
}

function sendCallExpired(res: Response) {
  return res.status(410).json({
    code: "CALL_EXPIRED",
    message: "This private call expired. Please scan the QR again to start a new call."
  });
}

function sendCallUnavailable(res: Response) {
  return res.status(404).json({
    code: "CALL_NOT_AVAILABLE",
    message: "This private call is no longer available. Please scan the QR again."
  });
}

async function validateScannerCall(callSessionId: string, token: string) {
  const tokenHash = hashCallToken(token);
  const callSession = await prisma.callSession.findFirst({
    where: { id: callSessionId, scannerTokenHash: tokenHash, deletedAt: null },
    include: { qrTag: { select: { id: true, label: true, type: true, status: true, ownerId: true, deletedAt: true } } }
  });
  if (!callSession) return { result: "unavailable" as const, callSession: null };
  const lifecycle = await expireCallIfNeeded(callSession);
  if (lifecycle.expired || lifecycle.callSession.status === CallSessionStatus.EXPIRED) {
    return { result: "expired" as const, callSession: lifecycle.callSession };
  }
  if (!isPublicTagActive(lifecycle.callSession.qrTag)) {
    return { result: "unavailable" as const, callSession: lifecycle.callSession };
  }
  return { result: "active" as const, callSession: lifecycle.callSession };
}

async function userRoles(userId: string): Promise<RoleName[]> {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  return roles.map((entry) => entry.role.name);
}

async function ensureRole(userId: string, roleName: RoleName) {
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id }
  });
}

function isActiveUser<T extends { status: UserStatus; deletedAt: Date | null }>(user: T | null | undefined): user is T {
  return Boolean(user && !user.deletedAt && user.status === UserStatus.ACTIVE);
}

async function assertActiveUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, deletedAt: true }
  });
  if (!isActiveUser(user)) {
    throw Object.assign(new Error("User not active"), { statusCode: 401 });
  }
}

async function issueTokens(userId: string, req: Request) {
  await assertActiveUser(userId);
  const roles = await userRoles(userId);
  const accessToken = signAccessToken(userId, roles);
  const refreshToken = randomToken();
  const familyId = randomToken(18);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      familyId,
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
      expiresAt
    }
  });
  return { accessToken, refreshToken, expiresAt, roles };
}

async function rotateRefreshToken(refreshToken: string, req: Request) {
  const tokenHash = hashRefreshToken(refreshToken);
  const now = new Date();
  const nextRefreshToken = randomToken();
  const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const rotated = await prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ where: { refreshTokenHash: tokenHash } });
    if (!session) return { ok: false as const };
    if (session.status !== "ACTIVE" || session.expiresAt < now) {
      await tx.session.updateMany({
        where: { familyId: session.familyId, status: "ACTIVE" },
        data: { status: "REVOKED", revokedAt: now }
      });
      return { ok: false as const };
    }

    const user = await tx.user.findUnique({
      where: { id: session.userId },
      select: { id: true, status: true, deletedAt: true }
    });
    if (!isActiveUser(user)) {
      await tx.session.updateMany({
        where: { userId: session.userId, status: "ACTIVE" },
        data: { status: "REVOKED", revokedAt: now }
      });
      return { ok: false as const };
    }

    const revoked = await tx.session.updateMany({
      where: { id: session.id, refreshTokenHash: tokenHash, status: "ACTIVE" },
      data: { status: "REVOKED", revokedAt: now }
    });
    if (revoked.count !== 1) {
      await tx.session.updateMany({
        where: { familyId: session.familyId, status: "ACTIVE" },
        data: { status: "REVOKED", revokedAt: now }
      });
      return { ok: false as const };
    }

    await tx.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: nextRefreshTokenHash,
        familyId: session.familyId,
        userAgent: req.get("user-agent"),
        ipAddress: req.ip,
        expiresAt
      }
    });
    const roleEntries = await tx.userRole.findMany({
      where: { userId: session.userId },
      include: { role: true }
    });
    return { ok: true as const, userId: session.userId, roles: roleEntries.map((entry) => entry.role.name) };
  });

  if (!rotated.ok) {
    throw Object.assign(new Error("Invalid refresh token"), { statusCode: 401 });
  }
  const accessToken = signAccessToken(rotated.userId, rotated.roles);
  return { accessToken, refreshToken: nextRefreshToken, expiresAt, roles: rotated.roles };
}

async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : readCookie(req, accessCookieName);
    if (!token) {
      debugLog("auth.requireAuth.missingToken", { method: req.method, path: safeRequestPath(req), hasCookie: Boolean(req.headers.cookie) });
      throw new Error("Missing bearer token");
    }
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { userRoles: { include: { role: true } } }
    });
    if (!isActiveUser(user)) {
      debugLog("auth.requireAuth.inactiveUser", { method: req.method, path: safeRequestPath(req), userId: shortId(payload.sub), found: Boolean(user) });
      throw new Error("User not active");
    }
    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      roles: user.userRoles.map((entry) => entry.role.name)
    };
    debugLog("auth.requireAuth.success", {
      method: req.method,
      path: safeRequestPath(req),
      userId: shortId(user.id),
      email: maskEmail(user.email),
      roles: req.user.roles.join(",")
    });
    next();
  } catch (error) {
    if (error instanceof Error && !["Missing bearer token", "User not active"].includes(error.message)) {
      debugLog("auth.requireAuth.failed", { method: req.method, path: safeRequestPath(req), error: error.message });
    }
    next(Object.assign(new Error("Unauthorized"), { statusCode: 401 }));
  }
}

function requireRoles(...allowed: RoleName[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const roles = req.user?.roles || [];
    if (roles.includes(RoleName.SUPER_ADMIN) || allowed.some((role) => roles.includes(role))) {
      return next();
    }
    return next(Object.assign(new Error("Forbidden"), { statusCode: 403 }));
  };
}

function hasGlobalSocietyAccess(user?: AuthUser) {
  const roles = user?.roles || [];
  return roles.includes(RoleName.SUPER_ADMIN) || roles.includes(RoleName.SOCIETY_MANAGER);
}

const allSocietyMemberRoles = [SocietyMemberRole.SOCIETY_ADMIN, SocietyMemberRole.GUARD, SocietyMemberRole.RESIDENT];

function requireSocietyRoles(...allowed: SocietyMemberRole[]) {
  const allowedRoles = allowed.length ? allowed : allSocietyMemberRoles;
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return next(Object.assign(new Error("Unauthorized"), { statusCode: 401 }));
    if (hasGlobalSocietyAccess(user)) return next();
    prisma.societyMember
      .findFirst({
        where: {
          societyId: req.params.id,
          userId: user.id,
          role: { in: allowedRoles }
        },
        select: { id: true }
      })
      .then((membership) => {
        if (!membership) return next(Object.assign(new Error("Forbidden"), { statusCode: 403 }));
        return next();
      })
      .catch(next);
  };
}

async function audit(req: AuthedRequest, action: string, entityType: string, entityId?: string, metadata: Prisma.InputJsonValue = {}) {
  await prisma.auditLog.create({
    data: {
      actorId: req.user?.id,
      action,
      entityType,
      entityId,
      ipAddress: req.ip,
      metadata
    }
  });
}

const requestOtpSchema = z.object({
  phone: z.string().min(8),
  purpose: z.enum(["LOGIN", "REGISTER", "PIN_RESET"]).default("LOGIN")
});

const verifyOtpSchema = z.object({
  phone: z.string().min(8),
  otp: z.string().regex(/^\d{6}$/),
  fullName: z.string().trim().min(2).max(100).optional(),
  language: z.enum(["EN", "BN"]).default("EN")
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  district: z.string().max(80).optional().nullable(),
  address: z.string().max(240).optional().nullable(),
  language: z.enum(["EN", "BN"]).optional()
});

const tagSchema = z.object({
  type: z.nativeEnum(QrTagType),
  label: z.string().trim().min(2).max(80),
  vehicleNumber: z.string().trim().max(30).optional(),
  itemName: z.string().trim().max(80).optional(),
  privacyMode: z.enum(["PRIVATE_CONTACT_ONLY", "SHOW_NAME_ONLY", "SHOW_BUSINESS_INFO", "PHONE_VISIBLE_BY_OWNER_CHOICE"]).default("PRIVATE_CONTACT_ONLY"),
  contactSettings: z
    .object({
      allowContactForm: z.boolean().default(true),
      allowWhatsapp: z.boolean().default(false),
      allowSms: z.boolean().default(false),
      phoneVisible: z.boolean().default(false),
      showName: z.boolean().default(false),
      showEmergency: z.boolean().default(false)
    })
    .default({})
});

const tagActivationSchema = z.object({
  activationCode: z.string().trim().min(4).max(120)
});

const adminCreateTagSchema = tagSchema.extend({
  ownerPhone: z.string().min(8),
  ownerName: z.string().trim().min(2).max(100)
});

const resellerBatchCreateSchema = z
  .object({
    resellerId: z.string().min(1),
    batchCode: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[A-Za-z0-9_-]+$/, "Batch code may contain letters, numbers, hyphens, and underscores only")
      .optional(),
    tagIds: z.array(z.string().min(1)).max(1000).optional(),
    publicSlugs: z.array(z.string().min(4).max(200)).max(1000).optional(),
    quantity: z.number().int().min(1).max(1000).optional(),
    tagType: z.nativeEnum(QrTagType).default(QrTagType.OTHER),
    labelPrefix: z.string().trim().min(1).max(80).default("Reseller QR"),
    notes: z.string().trim().max(500).optional()
  })
  .refine((input) => Boolean(input.quantity || input.tagIds?.length || input.publicSlugs?.length), {
    message: "Provide quantity, tagIds, or publicSlugs to allocate a reseller batch"
  });

const contactRequestSchema = z.object({
  reason: z.nativeEnum(ContactReason),
  message: z.string().trim().min(3).max(500),
  scannerName: z.string().trim().max(80).optional(),
  scannerContact: z.string().trim().max(80).optional()
});

const chatMessageSchema = z.object({
  body: z.string().trim().min(1).max(500)
});

const publicChatMessageSchema = chatMessageSchema.extend({
  token: z.string().min(20),
  senderName: z.string().trim().max(80).optional()
});

const publicCallStartSchema = z.object({
  scannerName: z.string().trim().max(80).optional()
});

const callSignalSchema = z.object({
  token: z.string().min(20).optional(),
  type: z.string().trim().min(2).max(40),
  payload: z.record(z.unknown())
});

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        productVariantId: z.string().optional(),
        quantity: z.number().int().min(1).max(100).default(1)
      })
    )
    .optional(),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().min(8),
  deliveryAddress: z.string().trim().min(5).max(240),
  deliveryCity: z.string().max(80).optional(),
  deliveryDistrict: z.string().max(80).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD),
  notes: z.string().max(300).optional()
});

const publicOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().min(8),
  deliveryAddress: z.string().trim().min(5).max(240),
  deliveryCity: z.string().trim().min(1).max(80),
  deliveryDistrict: z.string().trim().min(1).max(80),
  productId: z.string().optional(),
  productSlug: z.string().trim().min(2).max(120).optional(),
  quantity: z.number().int().min(1).max(20).default(1),
  tagLabel: z.string().trim().max(80).optional(),
  vehicleNumber: z.string().trim().max(30).optional(),
  note: z.string().trim().max(300).optional(),
  paymentMethod: z.literal("COD").default("COD")
});

function publicUrlFor(slug: string) {
  return `${env.appUrl.replace(/\/$/, "")}/t/${slug}`;
}

function qrImageUrlFor(slug: string) {
  return `${env.apiUrl.replace(/\/$/, "")}/qr/${slug}.png`;
}

function createResellerBatchCode() {
  return `RB-${createPublicSlug().slice(0, 12).toUpperCase()}`;
}

type ResellerBatchDtoSource = {
  id: string;
  batchCode: string;
  resellerId: string;
  status: ResellerBatchStatus;
  notes: string | null;
  assignedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  reseller?: { businessName: string; user?: { fullName: string | null; phone: string } | null } | null;
  tags?: Array<{ ownerId: string | null; status: QrTagStatus; deletedAt: Date | null }>;
};

function resellerBatchDto(batch: ResellerBatchDtoSource) {
  const tags = batch.tags?.filter((tag) => !tag.deletedAt) ?? [];
  const assignedTagCount = tags.filter((tag) => Boolean(tag.ownerId) || tag.status === QrTagStatus.ACTIVE).length;
  const pendingTagCount = tags.filter((tag) => !tag.ownerId && tag.status === QrTagStatus.PENDING_ACTIVATION).length;
  return {
    id: batch.id,
    batchCode: batch.batchCode,
    resellerId: batch.resellerId,
    resellerName: batch.reseller?.businessName ?? null,
    resellerOwnerName: batch.reseller?.user?.fullName ?? null,
    resellerPhone: batch.reseller?.user?.phone ?? null,
    status: batch.status,
    notes: batch.notes,
    tagCount: tags.length,
    assignedTagCount,
    pendingTagCount,
    assignedAt: batch.assignedAt,
    closedAt: batch.closedAt,
    createdAt: batch.createdAt
  };
}

type PublicTagState = {
  status: QrTagStatus;
  ownerId: string | null;
  deletedAt: Date | null;
};

type SafePublicTagInput = PublicTagState & {
  publicSlug: string;
  type: QrTagType;
  label: string;
  vehicleNumber: string | null;
  itemName: string | null;
  privacyMode: string;
  owner: {
    fullName: string | null;
    phone: string;
    emergencyContacts: Array<{
      name: string;
      relation: string | null;
      phone: string;
      visibleOnPublic: boolean;
      deletedAt: Date | null;
    }>;
  } | null;
  contactSetting: {
    allowContactForm: boolean;
    allowWhatsapp: boolean;
    allowSms: boolean;
    phoneVisible: boolean;
    showName: boolean;
    showEmergency: boolean;
  } | null;
};

function isPublicTagActive<T extends PublicTagState>(
  tag: T
): tag is T & { status: typeof QrTagStatus.ACTIVE; ownerId: string; deletedAt: null } {
  return !tag.deletedAt && tag.status === QrTagStatus.ACTIVE && Boolean(tag.ownerId);
}

function inactivePublicTagDto(tag: { publicSlug: string }) {
  return {
    publicSlug: tag.publicSlug,
    publicUrl: publicUrlFor(tag.publicSlug),
    status: "INACTIVE",
    isActive: false,
    contactOptions: {
      contactForm: false,
      whatsapp: false,
      sms: false,
      phoneVisible: false,
      emergencyVisible: false
    },
    links: {
      whatsapp: null,
      sms: null
    },
    emergencyContacts: []
  };
}

function safePublicTagDto(tag: SafePublicTagInput) {
  if (!isPublicTagActive(tag)) return inactivePublicTagDto(tag);
  const settings = tag.contactSetting;
  const ownerPhone = tag.owner?.phone || "";
  const showPhone = Boolean(settings?.phoneVisible && tag.privacyMode === "PHONE_VISIBLE_BY_OWNER_CHOICE");
  const safeEmergency =
    settings?.showEmergency && tag.owner
      ? tag.owner.emergencyContacts
          .filter((entry) => entry.visibleOnPublic && !entry.deletedAt)
          .map((entry) => ({ name: entry.name, relation: entry.relation, phone: entry.phone }))
      : [];
  return {
    publicSlug: tag.publicSlug,
    publicUrl: publicUrlFor(tag.publicSlug),
    status: QrTagStatus.ACTIVE,
    isActive: true,
    type: tag.type,
    label: tag.label,
    vehicleNumberHint: tag.vehicleNumber ? tag.vehicleNumber.slice(-4).padStart(tag.vehicleNumber.length, "*") : null,
    itemName: tag.type === QrTagType.LOST_ITEM ? tag.itemName : undefined,
    owner: {
      name: settings?.showName ? tag.owner?.fullName || null : null,
      phone: showPhone ? ownerPhone : null
    },
    contactOptions: {
      contactForm: settings?.allowContactForm ?? true,
      whatsapp: Boolean(settings?.allowWhatsapp),
      sms: Boolean(settings?.allowSms),
      phoneVisible: showPhone,
      emergencyVisible: Boolean(settings?.showEmergency)
    },
    links: {
      whatsapp: settings?.allowWhatsapp && ownerPhone ? `https://wa.me/${ownerPhone.replace("+", "")}` : null,
      sms: settings?.allowSms && ownerPhone ? `sms:${ownerPhone}` : null
    },
    emergencyContacts: safeEmergency
  };
}

function sendInactivePublicTag(res: Response) {
  return res.status(409).json({ error: "QR tag is inactive" });
}

type UserDtoSource = {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  language?: Language;
  status?: UserStatus;
  phoneVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  profile?: unknown;
  emergencyContacts?: unknown;
  userRoles?: Array<{ role: { id?: string; name: RoleName; description?: string | null; createdAt?: Date; updatedAt?: Date } }>;
};

function roleNamesFromUser(user: UserDtoSource) {
  return user.userRoles?.map((entry) => entry.role.name) ?? [];
}

function safeUserDto(user: UserDtoSource | null | undefined) {
  if (!user) return null;
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    fullName: user.fullName,
    language: user.language,
    status: user.status,
    phoneVerifiedAt: user.phoneVerifiedAt ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    profile: user.profile,
    emergencyContacts: user.emergencyContacts,
    roles: roleNamesFromUser(user)
  };
}

function safeAdminUserDto(user: UserDtoSource | null | undefined) {
  if (!user) return null;
  const base = safeUserDto(user)!;
  return {
    ...base,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt ?? null,
    userRoles: user.userRoles?.map((entry) => ({ role: entry.role }))
  };
}

function ownerDto(user: { id: string; fullName: string | null; phone: string; email?: string | null }) {
  return {
    id: user.id,
    name: user.fullName || "Owner",
    fullName: user.fullName,
    phone: user.phone,
    email: user.email ?? null
  };
}

async function findOwnerAppAccount(phone: string) {
  return prisma.user.findFirst({
    where: {
      phone,
      deletedAt: null,
      status: UserStatus.ACTIVE,
      OR: [
        { ownedTags: { some: { deletedAt: null } } },
        { contactRequests: { some: { deletedAt: null } } },
        { orders: { some: { deletedAt: null } } }
      ]
    }
  });
}

function ownerTagDto(tag: { id: string; publicSlug: string; label: string; type: QrTagType; status: QrTagStatus; scanCount: number; lastScannedAt: Date | null; createdAt: Date }) {
  return {
    id: tag.id,
    label: tag.label,
    type: tag.type,
    status: tag.status,
    scanCount: tag.scanCount,
    publicUrl: publicUrlFor(tag.publicSlug),
    qrImageUrl: qrImageUrlFor(tag.publicSlug),
    lastScannedAt: tag.lastScannedAt,
    createdAt: tag.createdAt
  };
}

function ownerRequestDto(request: {
  id: string;
  reason: ContactReason;
  message: string;
  scannerName: string | null;
  status: ContactRequestStatus;
  readAt: Date | null;
  lastActivityAt: Date | null;
  expiresAt: Date | null;
  expiredAt: Date | null;
  closedAt: Date | null;
  deleteAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  qrTag: { id: string; label: string } | null;
}) {
  return {
    id: request.id,
    reason: request.reason,
    tagId: request.qrTag?.id,
    tagLabel: request.qrTag?.label || "QR tag",
    scannerMessage: request.message,
    scannerName: request.scannerName,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    lastActivityAt: request.lastActivityAt,
    expiresAt: request.expiresAt,
    expiredAt: request.expiredAt,
    closedAt: request.closedAt,
    deleteAt: request.deleteAt,
    isUnread: request.status === ContactRequestStatus.OPEN && !request.readAt,
    status: request.status.toLowerCase(),
    canReply: isConversationReplyAllowed(request)
  };
}

function ownerMessageDto(message: { id: string; sender: ContactMessageSender; body: string; createdAt: Date }) {
  return {
    id: message.id,
    senderType: message.sender === ContactMessageSender.OWNER ? "owner" : message.sender === ContactMessageSender.SCANNER ? "scanner" : "system",
    message: message.body,
    createdAt: message.createdAt,
    status: "sent"
  };
}

function callSessionDto(callSession: {
  id: string;
  scannerName: string | null;
  status: CallSessionStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  qrTag?: { id: string; label: string; type?: QrTagType } | null;
}) {
  return {
    id: callSession.id,
    status: callSession.status,
    scannerName: callSession.scannerName,
    tagId: callSession.qrTag?.id ?? null,
    tagLabel: callSession.qrTag?.label ?? "QR tag",
    tagType: callSession.qrTag?.type ?? null,
    expiresAt: callSession.expiresAt,
    acceptedAt: callSession.acceptedAt,
    endedAt: callSession.endedAt,
    createdAt: callSession.createdAt,
    iceServers: configuredIceServers()
  };
}

function callSignalDto(signal: { id: string; sender: CallSignalSender; type: string; payload: Prisma.JsonValue; createdAt: Date }) {
  return {
    id: signal.id,
    sender: signal.sender.toLowerCase(),
    type: signal.type,
    payload: signal.payload,
    createdAt: signal.createdAt
  };
}

function publicMessageDto(message: { id: string; sender: ContactMessageSender; senderName: string | null; body: string; createdAt: Date }) {
  return {
    id: message.id,
    sender: message.sender,
    senderName: message.sender === ContactMessageSender.SCANNER ? message.senderName : null,
    body: message.body,
    createdAt: message.createdAt
  };
}

function ownerNotificationDto(notification: { id: string; type: NotificationType; title: string; body: string; data: Prisma.JsonValue; readAt: Date | null; createdAt: Date }) {
  const data = typeof notification.data === "object" && notification.data !== null && !Array.isArray(notification.data) ? (notification.data as Record<string, unknown>) : {};
  const contactRequestId = typeof data.contactRequestId === "string" ? data.contactRequestId : undefined;
  const qrTagId = typeof data.qrTagId === "string" ? data.qrTagId : undefined;
  const orderId = typeof data.orderId === "string" ? data.orderId : undefined;
  const callSessionId = typeof data.callSessionId === "string" ? data.callSessionId : undefined;
  const notificationType = typeof data.type === "string" ? data.type : notification.type.toLowerCase();
  const actionType = callSessionId ? "call" : contactRequestId ? "request" : qrTagId ? "tag" : orderId ? "order" : null;
  return {
    id: notification.id,
    type: notificationType,
    title: notification.title,
    body: notification.body,
    createdAt: notification.createdAt,
    isRead: Boolean(notification.readAt),
    actionType,
    actionId: callSessionId || contactRequestId || qrTagId || orderId || null
  };
}

function ownerOrderDto(order: { id: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus; totalBdt: number; createdAt: Date; items?: Array<{ name: string }> }) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status.toLowerCase(),
    codStatus: order.paymentStatus.toLowerCase(),
    productName: order.items?.[0]?.name || "QR product",
    priceBdt: order.totalBdt,
    createdAt: order.createdAt
  };
}

function ownerProductDto(product: { id: string; name: string; description: string; priceBdt: number; active: boolean; metadata: Prisma.JsonValue }) {
  const metadata = typeof product.metadata === "object" && product.metadata !== null && !Array.isArray(product.metadata) ? (product.metadata as Record<string, unknown>) : {};
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceBdt: product.priceBdt,
    isActive: product.active,
    estimatedDeliveryNote: typeof metadata.estimatedDeliveryNote === "string" ? metadata.estimatedDeliveryNote : null
  };
}

function productMetadata(product: { metadata: Prisma.JsonValue }) {
  return typeof product.metadata === "object" && product.metadata !== null && !Array.isArray(product.metadata)
    ? (product.metadata as Record<string, unknown>)
    : {};
}

function publicProductDto(product: {
  id: string;
  slug: string;
  type: ProductType;
  name: string;
  description: string;
  priceBdt: number;
  active: boolean;
  metadata: Prisma.JsonValue;
}) {
  const metadata = productMetadata(product);
  const list = (key: string) => (Array.isArray(metadata[key]) ? (metadata[key] as unknown[]).filter((item): item is string => typeof item === "string") : []);
  return {
    id: product.id,
    slug: product.slug,
    type: product.type,
    name: product.name,
    description: product.description,
    priceBdt: product.priceBdt,
    isActive: product.active,
    bestUseCase: typeof metadata.bestUseCase === "string" ? metadata.bestUseCase : null,
    estimatedDeliveryNote: typeof metadata.estimatedDeliveryNote === "string" ? metadata.estimatedDeliveryNote : null,
    features: list("features"),
    included: list("included"),
    seoTitle: typeof metadata.seoTitle === "string" ? metadata.seoTitle : null,
    seoDescription: typeof metadata.seoDescription === "string" ? metadata.seoDescription : null,
    faq: Array.isArray(metadata.faq) ? metadata.faq : []
  };
}

function publicOrderDto(order: {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotalBdt: number;
  deliveryFeeBdt: number;
  totalBdt: number;
  customerName: string;
  deliveryCity: string | null;
  deliveryDistrict: string | null;
  createdAt: Date;
  items?: Array<{ name: string; quantity: number; unitPriceBdt: number; totalBdt: number }>;
}) {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    trackingCode: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotalBdt: order.subtotalBdt,
    deliveryFeeBdt: order.deliveryFeeBdt,
    totalBdt: order.totalBdt,
    customerName: order.customerName,
    deliveryCity: order.deliveryCity,
    deliveryDistrict: order.deliveryDistrict,
    productName: order.items?.[0]?.name || "QR tag",
    quantity: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 1,
    items: order.items || [],
    createdAt: order.createdAt
  };
}

function orderNumber() {
  return `SCBD-${Date.now().toString(36).toUpperCase()}`;
}

async function makeSafePublicTag(slug: string) {
  const tag = await prisma.qrTag.findUnique({
    where: { publicSlug: slug },
    include: {
      owner: { include: { emergencyContacts: true } },
      contactSetting: true
    }
  });
  if (!tag) return null;
  return safePublicTagDto(tag);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "scancontact-api", time: new Date().toISOString() });
});

app.post(
  "/auth/request-otp",
  otpLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(requestOtpSchema, req);
    const phone = normalizeBangladeshPhone(input.phone);
    debugLog("owner.auth.requestOtp", { phone: maskPhone(phone), purpose: input.purpose, provider: otpProvider.getProviderName() });
    const existingUser = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, status: true, deletedAt: true }
    });
    if (existingUser && !isActiveUser(existingUser)) {
      return res.status(403).json({ error: "This account is not active. Please contact support." });
    }
    const recent = await prisma.authOtp.count({
      where: { phone, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } }
    });
    if (recent >= 3) {
      debugLog("owner.auth.requestOtp.rateLimited", { phone: maskPhone(phone), recent });
      return res.status(429).json({ error: "Too many OTP requests. Please wait before trying again." });
    }
    const otp = generateOtp();
    const delivery = await otpProvider.sendOtp(phone, otp);
    await prisma.authOtp.create({
      data: {
        phone,
        purpose: input.purpose,
        otpHash: hmac(`${phone}:${otp}`),
        provider: otpProvider.getProviderName(),
        messageId: delivery.messageId,
        requestIp: req.ip,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
    res.json({
      ok: true,
      phone,
      provider: otpProvider.getProviderName(),
      devOtp: isLocalDevelopment ? delivery.devOtp : undefined
    });
  })
);

app.post(
  "/auth/login",
  otpLimiter,
  asyncRoute(async (req, res) => {
    req.body = { ...req.body, purpose: "LOGIN" };
    const input = parseBody(requestOtpSchema, req);
    const phone = normalizeBangladeshPhone(input.phone);
    const existingUser = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, status: true, deletedAt: true }
    });
    if (existingUser && !isActiveUser(existingUser)) {
      return res.status(403).json({ error: "This account is not active. Please contact support." });
    }
    const otp = generateOtp();
    const delivery = await otpProvider.sendOtp(phone, otp);
    await prisma.authOtp.create({
      data: {
        phone,
        purpose: "LOGIN",
        otpHash: hmac(`${phone}:${otp}`),
        provider: otpProvider.getProviderName(),
        messageId: delivery.messageId,
        requestIp: req.ip,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
    res.json({ ok: true, phone, devOtp: isLocalDevelopment ? delivery.devOtp : undefined });
  })
);

app.post(
  "/auth/verify-otp",
  otpVerifyLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(verifyOtpSchema, req);
    const phone = normalizeBangladeshPhone(input.phone);
    const otpRecord = await prisma.authOtp.findFirst({
      where: { phone, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" }
    });
    if (!otpRecord) return res.status(400).json({ error: "OTP expired or not found" });
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { status: "LOCKED" } });
      return res.status(423).json({ error: "OTP locked. Request a new code." });
    }
    const expected = hmac(`${phone}:${input.otp}`);
    if (expected !== otpRecord.otpHash) {
      await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { attempts: { increment: 1 } } });
      return res.status(400).json({ error: "Invalid OTP" });
    }
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser && !isActiveUser(existingUser)) {
      await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { status: "LOCKED" } });
      return res.status(403).json({ error: "This account is not active. Please contact support." });
    }
    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: input.fullName,
            language: input.language as Language,
            phoneVerifiedAt: new Date(),
            lastLoginAt: new Date()
          }
        })
      : await prisma.user.create({
          data: {
            phone,
            fullName: input.fullName,
            language: input.language as Language,
            phoneVerifiedAt: new Date(),
            lastLoginAt: new Date(),
            profile: {
              create: {
                privacySettings: {
                  phoneVisible: false,
                  nameVisible: false,
                  emergencyVisible: false
                },
                notificationSettings: {
                  scanAlerts: false,
                  contactRequestAlerts: true
                }
              }
            }
          }
        });
    await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { userId: user.id, status: "VERIFIED" } });
    await ensureRole(user.id, RoleName.USER);
    await prisma.consentLog.create({
      data: {
        userId: user.id,
        consentType: "otp_login_terms_privacy",
        version: "mvp-2026-04",
        granted: true,
        ipAddress: req.ip
      }
    });
    const tokens = await issueTokens(user.id, req);
    setAuthCookies(res, tokens);
    res.json({ ok: true, user: safeUserDto(user), ...tokens });
  })
);

app.post(
  "/owner/auth/request-otp",
  otpLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(requestOtpSchema, req);
    const phone = normalizeBangladeshPhone(input.phone);
    const existingOwner = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, fullName: true, status: true, deletedAt: true }
    });
    if (input.purpose === "LOGIN" || input.purpose === "PIN_RESET") {
      if (!existingOwner || existingOwner.deletedAt || !existingOwner.fullName) {
        debugLog("owner.auth.requestOtp.rejected", { phone: maskPhone(phone), purpose: input.purpose, reason: "owner_not_found" });
        return res.status(404).json({ error: "No owner account found for this phone. Please sign up or contact admin." });
      }
      if (existingOwner.status !== UserStatus.ACTIVE) {
        debugLog("owner.auth.requestOtp.rejected", { phone: maskPhone(phone), purpose: input.purpose, reason: "owner_not_active" });
        return res.status(403).json({ error: "This owner account is not active. Please contact support." });
      }
    }
    if (input.purpose === "REGISTER" && existingOwner?.deletedAt) {
      debugLog("owner.auth.requestOtp.rejected", { phone: maskPhone(phone), purpose: input.purpose, reason: "owner_deleted" });
      return res.status(403).json({ error: "This owner account cannot be used. Please contact support." });
    }
    const recent = await prisma.authOtp.count({
      where: { phone, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } }
    });
    if (recent >= 3) {
      return res.status(429).json({ error: "Too many OTP requests. Please wait before trying again." });
    }
    const otp = generateOtp();
    const delivery = await otpProvider.sendOtp(phone, otp);
    await prisma.authOtp.create({
      data: {
        phone,
        purpose: input.purpose,
        otpHash: hmac(`${phone}:${otp}`),
        provider: otpProvider.getProviderName(),
        messageId: delivery.messageId,
        requestIp: req.ip,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
    debugLog("owner.auth.requestOtp.sent", { phone: maskPhone(phone), provider: otpProvider.getProviderName(), devOtpReturned: Boolean(isLocalDevelopment && delivery.devOtp) });
    res.json({ ok: true, phone, provider: otpProvider.getProviderName(), devOtp: isLocalDevelopment ? delivery.devOtp : undefined });
  })
);

app.post(
  "/owner/auth/verify-otp",
  otpVerifyLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(verifyOtpSchema, req);
    const phone = normalizeBangladeshPhone(input.phone);
    const otpRecord = await prisma.authOtp.findFirst({
      where: { phone, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" }
    });
    if (!otpRecord) {
      debugLog("owner.auth.verifyOtp.failed", { phone: maskPhone(phone), reason: "not_found_or_expired" });
      return res.status(400).json({ error: "OTP expired or not found" });
    }
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { status: "LOCKED" } });
      debugLog("owner.auth.verifyOtp.failed", { phone: maskPhone(phone), reason: "locked" });
      return res.status(423).json({ error: "OTP locked. Request a new code." });
    }
    const expected = hmac(`${phone}:${input.otp}`);
    if (expected !== otpRecord.otpHash) {
      await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { attempts: { increment: 1 } } });
      debugLog("owner.auth.verifyOtp.failed", { phone: maskPhone(phone), reason: "invalid", attempts: otpRecord.attempts + 1 });
      return res.status(400).json({ error: "Invalid OTP" });
    }
    const existingOwner = await prisma.user.findUnique({ where: { phone } });
    if (existingOwner?.deletedAt) {
      await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { status: "LOCKED" } });
      debugLog("owner.auth.verifyOtp.failed", { phone: maskPhone(phone), purpose: otpRecord.purpose, reason: "owner_deleted" });
      return res.status(403).json({ error: "This owner account cannot be used. Please contact support." });
    }
    if (otpRecord.purpose !== "REGISTER" && (!existingOwner || existingOwner.deletedAt || !existingOwner.fullName)) {
      await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { status: "LOCKED" } });
      debugLog("owner.auth.verifyOtp.failed", { phone: maskPhone(phone), purpose: otpRecord.purpose, reason: "owner_not_found" });
      return res.status(404).json({ error: "No owner account found for this phone. Please sign up or contact admin." });
    }
    if (existingOwner?.status && existingOwner.status !== UserStatus.ACTIVE) {
      await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { status: "LOCKED" } });
      debugLog("owner.auth.verifyOtp.failed", { phone: maskPhone(phone), purpose: otpRecord.purpose, reason: "owner_not_active" });
      return res.status(403).json({ error: "This owner account is not active. Please contact support." });
    }
    if (otpRecord.purpose === "REGISTER" && !existingOwner && !input.fullName) {
      debugLog("owner.auth.verifyOtp.failed", { phone: maskPhone(phone), purpose: otpRecord.purpose, reason: "name_required" });
      return res.status(400).json({ error: "Owner name is required for signup." });
    }
    const user = existingOwner
      ? await prisma.user.update({
          where: { id: existingOwner.id },
          data: {
            fullName: input.fullName ?? existingOwner.fullName,
            language: input.language as Language,
            phoneVerifiedAt: new Date(),
            lastLoginAt: new Date()
          }
        })
      : await prisma.user.create({
          data: {
            phone,
            fullName: input.fullName,
            language: input.language as Language,
            phoneVerifiedAt: new Date(),
            lastLoginAt: new Date(),
            profile: {
              create: {
                privacySettings: { phoneVisible: false, nameVisible: false, emergencyVisible: false },
                notificationSettings: { scanAlerts: false, contactRequestAlerts: true }
              }
            }
          }
        });
    await prisma.authOtp.update({ where: { id: otpRecord.id }, data: { userId: user.id, status: "VERIFIED" } });
    await ensureRole(user.id, RoleName.USER);
    await prisma.consentLog.create({
      data: {
        userId: user.id,
        consentType: "owner_otp_login_terms_privacy",
        version: "mvp-2026-04",
        granted: true,
        ipAddress: req.ip
      }
    });
    const tokens = await issueTokens(user.id, req);
    debugLog("owner.auth.verifyOtp.success", { ownerId: shortId(user.id), phone: maskPhone(user.phone), namePresent: Boolean(user.fullName) });
    res.json({ ok: true, token: tokens.accessToken, owner: ownerDto(user), ...tokens });
  })
);

app.post(
  "/auth/admin-login",
  adminLoginLimiter,
  asyncRoute(async (req, res) => {
    const input = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body);
    debugLog("admin.login.api.start", { email: maskEmail(input.email), ip: req.ip, userAgentPresent: Boolean(req.get("user-agent")) });
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !isActiveUser(user) || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      debugLog("admin.login.api.failed", {
        email: maskEmail(input.email),
        userFound: Boolean(user),
        active: Boolean(user && isActiveUser(user)),
        hasPassword: Boolean(user?.passwordHash)
      });
      await prisma.auditLog.create({
        data: {
          action: "ADMIN_LOGIN_FAILURE",
          entityType: "User",
          ipAddress: req.ip,
          metadata: { email: input.email, result: "failed", userAgent: req.get("user-agent") }
        }
      });
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const roles = await userRoles(user.id);
    const adminRoles: RoleName[] = [RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN, RoleName.ORDER_MANAGER];
    if (!roles.some((role) => adminRoles.includes(role))) {
      debugLog("admin.login.api.permissionDenied", { email: maskEmail(input.email), userId: shortId(user.id), roles: roles.join(",") });
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "ADMIN_LOGIN_PERMISSION_DENIED",
          entityType: "User",
          entityId: user.id,
          ipAddress: req.ip,
          metadata: { email: input.email, result: "permission_denied", userAgent: req.get("user-agent") }
        }
      });
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const tokens = await issueTokens(user.id, req);
    debugLog("admin.login.api.success", { email: maskEmail(user.email), userId: shortId(user.id), roles: roles.join(","), accessTokenIssued: true, refreshTokenIssued: true });
    await audit({ ...req, user: { id: user.id, phone: user.phone, email: user.email, fullName: user.fullName, roles } } as AuthedRequest, "ADMIN_LOGIN_SUCCESS", "User", user.id, {
      email: user.email,
      result: "success",
      userAgent: req.get("user-agent")
    });
    const userDto = safeAdminUserDto(user)!;
    res.json({ ok: true, user: { ...userDto, roles }, ...tokens });
  })
);

app.post(
  "/auth/admin-login-form",
  adminLoginLimiter,
  asyncRoute(async (req, res) => {
    const loginUrl = "/admin/login?error=invalid";
    const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
    debugLog("admin.login.form.start", {
      email: typeof req.body?.email === "string" ? maskEmail(req.body.email) : "invalid",
      bodyKeys: Object.keys(req.body || {}).join(","),
      referer: req.get("referer") || "none"
    });
    if (!parsed.success) {
      debugLog("admin.login.form.validationFailed", { issues: parsed.error.issues.map((issue) => issue.path.join(".")).join(",") });
      return res.redirect(loginUrl);
    }
    const input = parsed.data;
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !isActiveUser(user) || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      debugLog("admin.login.form.failed", {
        email: maskEmail(input.email),
        userFound: Boolean(user),
        active: Boolean(user && isActiveUser(user)),
        hasPassword: Boolean(user?.passwordHash)
      });
      await prisma.auditLog.create({
        data: {
          action: "ADMIN_LOGIN_FAILURE",
          entityType: "User",
          ipAddress: req.ip,
          metadata: { email: input.email, result: "failed", userAgent: req.get("user-agent") }
        }
      });
      return res.redirect(loginUrl);
    }
    const roles = await userRoles(user.id);
    const adminRoles: RoleName[] = [RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN, RoleName.ORDER_MANAGER];
    if (!roles.some((role) => adminRoles.includes(role))) {
      debugLog("admin.login.form.permissionDenied", { email: maskEmail(input.email), userId: shortId(user.id), roles: roles.join(",") });
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "ADMIN_LOGIN_PERMISSION_DENIED",
          entityType: "User",
          entityId: user.id,
          ipAddress: req.ip,
          metadata: { email: input.email, result: "permission_denied", userAgent: req.get("user-agent") }
        }
      });
      return res.redirect(loginUrl);
    }
    const tokens = await issueTokens(user.id, req);
    setAuthCookies(res, tokens);
    debugLog("admin.login.form.success", {
      email: maskEmail(user.email),
      userId: shortId(user.id),
      roles: roles.join(","),
      cookieSet: true,
      devTokenRedirect: !isProduction
    });
    await audit({ ...req, user: { id: user.id, phone: user.phone, email: user.email, fullName: user.fullName, roles } } as AuthedRequest, "ADMIN_LOGIN_SUCCESS", "User", user.id, {
      email: user.email,
      result: "success",
      userAgent: req.get("user-agent"),
      mode: "form"
    });
    if (!isProduction) {
      const params = new URLSearchParams({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      debugLog("admin.login.form.redirect", { target: "/admin/overview", mode: "dev_query_tokens" });
      return res.redirect(`/admin/overview?${params.toString()}`);
    }
    debugLog("admin.login.form.redirect", { target: "/admin/overview", mode: "cookie" });
    return res.redirect("/admin/overview");
  })
);

app.post(
  "/auth/refresh",
  asyncRoute(async (req, res) => {
    const input = z.object({ refreshToken: z.string().min(20).optional() }).parse(req.body);
    const refreshToken = input.refreshToken || readCookie(req, refreshCookieName);
    if (!refreshToken) throw Object.assign(new Error("Invalid refresh token"), { statusCode: 401 });
    const tokens = await rotateRefreshToken(refreshToken, req);
    setAuthCookies(res, tokens);
    res.json({ ok: true, ...tokens });
  })
);

app.post(
  "/auth/logout",
  asyncRoute(async (req, res) => {
    const input = z.object({ refreshToken: z.string().min(20).optional() }).parse(req.body);
    const header = req.get("authorization") || "";
    const accessToken = header.startsWith("Bearer ") ? header.slice(7) : readCookie(req, accessCookieName);
    let actorId: string | undefined;
    if (accessToken) {
      try {
        actorId = verifyAccessToken(accessToken).sub;
      } catch {
        actorId = undefined;
      }
    }
    if (input.refreshToken) {
      await prisma.session.updateMany({
        where: { refreshTokenHash: hashRefreshToken(input.refreshToken) },
        data: { status: "REVOKED", revokedAt: new Date() }
      });
    }
    if (actorId) {
      await prisma.auditLog.create({
        data: {
          actorId,
          action: "ADMIN_LOGOUT",
          entityType: "Session",
          ipAddress: req.ip,
          metadata: { result: "success", userAgent: req.get("user-agent") }
        }
      });
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  })
);

app.post(
  "/auth/logout-all",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await prisma.session.updateMany({
      where: { userId: req.user!.id, status: "ACTIVE" },
      data: { status: "REVOKED", revokedAt: new Date() }
    });
    res.json({ ok: true });
  })
);

app.post(
  "/auth/set-pin",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ pin: z.string().regex(/^\d{4,8}$/) }).parse(req.body);
    await prisma.user.update({ where: { id: req.user!.id }, data: { pinHash: await bcrypt.hash(input.pin, 12) } });
    await audit(req, "SET_PIN", "User", req.user!.id);
    res.json({ ok: true });
  })
);

app.post(
  "/auth/login-pin",
  pinLoginLimiter,
  asyncRoute(async (req, res) => {
    const input = z.object({ phone: z.string(), pin: z.string() }).parse(req.body);
    const phone = normalizeBangladeshPhone(input.phone);
    const user = await prisma.user.findUnique({ where: { phone } });
    if (user && !isActiveUser(user)) {
      return res.status(403).json({ error: "This account is not active. Please contact support." });
    }
    if (!user?.pinHash || !(await bcrypt.compare(input.pin, user.pinHash))) {
      return res.status(401).json({ error: "Invalid PIN" });
    }
    const tokens = await issueTokens(user.id, req);
    res.json({ ok: true, user: safeUserDto(user), ...tokens });
  })
);

app.get(
  "/me",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true, userRoles: { include: { role: true } } }
    });
    debugLog("auth.me", {
      userId: shortId(req.user!.id),
      email: maskEmail(user?.email),
      phone: maskPhone(user?.phone),
      roles: user?.userRoles?.map((entry) => entry.role.name).join(",") || "none"
    });
    res.json({ user: safeUserDto(user) });
  })
);

app.patch(
  "/me",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = parseBody(updateProfileSchema, req);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        fullName: input.fullName,
        email: input.email,
        language: input.language,
        profile: {
          upsert: {
            update: { city: input.city, district: input.district, address: input.address },
            create: { city: input.city, district: input.district, address: input.address }
          }
        }
      },
      include: { profile: true }
    });
    res.json({ user: safeUserDto(user) });
  })
);

app.delete(
  "/me",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await prisma.dataDeletionRequest.create({ data: { userId: req.user!.id, reason: "User requested account deletion from DELETE /me" } });
    res.json({ ok: true, message: "Deletion request created. Support will process according to policy." });
  })
);

app.get(
  "/me/data-export",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const [user, tags, requests, orders] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user!.id }, include: { profile: true, emergencyContacts: true } }),
      prisma.qrTag.findMany({ where: { ownerId: req.user!.id } }),
      prisma.contactRequest.findMany({ where: { ownerId: req.user!.id } }),
      prisma.order.findMany({ where: { userId: req.user!.id }, include: { items: true, payments: true } })
    ]);
    res.json({ exportedAt: new Date().toISOString(), user: safeUserDto(user), tags, contactRequests: requests, orders });
  })
);

app.post(
  "/me/delete-request",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ reason: z.string().max(300).optional() }).parse(req.body);
    const request = await prisma.dataDeletionRequest.create({ data: { userId: req.user!.id, reason: input.reason } });
    res.json({ request });
  })
);

app.get(
  "/me/notifications",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json({ notifications });
  })
);

app.patch(
  "/me/notification-settings",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, notificationSettings: req.body },
      update: { notificationSettings: req.body }
    });
    res.json({ profile });
  })
);

app.patch(
  "/me/privacy-settings",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, privacySettings: req.body },
      update: { privacySettings: req.body }
    });
    await prisma.consentLog.create({
      data: {
        userId: req.user!.id,
        consentType: "privacy_settings_update",
        version: "mvp-2026-04",
        granted: true,
        ipAddress: req.ip
      }
    });
    res.json({ profile });
  })
);

app.post(
  "/devices/register",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ token: z.string().min(8), platform: z.string(), provider: z.string().default("noop") }).parse(req.body);
    const device = await prisma.deviceToken.upsert({
      where: { token: input.token },
      update: { userId: req.user!.id, platform: input.platform, provider: input.provider, enabled: true },
      create: { userId: req.user!.id, token: input.token, platform: input.platform, provider: input.provider }
    });
    debugLog("device.registered", { ownerId: shortId(req.user!.id), deviceId: shortId(device.id), platform: input.platform, provider: input.provider });
    res.json({ device });
  })
);

app.get(
  "/devices",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    res.json({ devices: await prisma.deviceToken.findMany({ where: { userId: req.user!.id, deletedAt: null } }) });
  })
);

app.delete(
  "/devices/:token",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const result = await prisma.deviceToken.updateMany({ where: { userId: req.user!.id, token: req.params.token }, data: { enabled: false, deletedAt: new Date() } });
    debugLog("device.deleted", { ownerId: shortId(req.user!.id), updated: result.count });
    res.json({ ok: result.count > 0 });
  })
);

app.get(
  "/me/emergency-contacts",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const contacts = await prisma.emergencyContact.findMany({ where: { userId: req.user!.id, deletedAt: null } });
    res.json({ contacts });
  })
);

app.post(
  "/me/emergency-contacts",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z
      .object({ name: z.string().min(2), phone: z.string(), relation: z.string().optional(), visibleOnPublic: z.boolean().default(false) })
      .parse(req.body);
    const contact = await prisma.emergencyContact.create({
      data: { ...input, phone: normalizeBangladeshPhone(input.phone), userId: req.user!.id }
    });
    res.json({ contact });
  })
);

app.patch(
  "/me/emergency-contacts/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const contact = await prisma.emergencyContact.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: req.body });
    res.json({ contact });
  })
);

app.delete(
  "/me/emergency-contacts/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await prisma.emergencyContact.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { deletedAt: new Date() } });
    res.json({ ok: true });
  })
);

app.post(
  "/tags",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = parseBody(tagSchema, req);
    const slug = createPublicSlug();
    const tag = await prisma.qrTag.create({
      data: {
        publicSlug: slug,
        ownerId: req.user!.id,
        createdById: req.user!.id,
        type: input.type,
        label: input.label,
        vehicleNumber: input.vehicleNumber,
        itemName: input.itemName,
        privacyMode: input.privacyMode,
        status: QrTagStatus.ACTIVE,
        contactSetting: { create: input.contactSettings }
      },
      include: { contactSetting: true }
    });
    res.status(201).json({ tag: { ...tag, publicUrl: publicUrlFor(tag.publicSlug) } });
  })
);

app.get(
  "/tags",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const tags = await prisma.qrTag.findMany({
      where: { ownerId: req.user!.id, deletedAt: null },
      include: { contactSetting: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ tags: tags.map((tag) => ({ ...tag, publicUrl: publicUrlFor(tag.publicSlug) })) });
  })
);

app.get(
  "/tags/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const tag = await prisma.qrTag.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null },
      include: { contactSetting: true }
    });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    res.json({ tag: { ...tag, publicUrl: publicUrlFor(tag.publicSlug) } });
  })
);

app.patch(
  "/tags/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = tagSchema.partial().parse(req.body);
    const existing = await prisma.qrTag.findFirst({ where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: "Tag not found" });
    const tag = await prisma.qrTag.update({
      where: { id: existing.id },
      data: {
        type: input.type,
        label: input.label,
        vehicleNumber: input.vehicleNumber,
        itemName: input.itemName,
        privacyMode: input.privacyMode,
        contactSetting: input.contactSettings
          ? { upsert: { create: input.contactSettings, update: input.contactSettings } }
          : undefined
      },
      include: { contactSetting: true }
    });
    res.json({ tag: { ...tag, publicUrl: publicUrlFor(tag.publicSlug) } });
  })
);

app.post(
  "/tags/:id/activate",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = parseBody(tagActivationSchema, req);
    const existing = await prisma.qrTag.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: { id: true, ownerId: true, status: true, activationCode: true }
    });
    if (!existing) return res.status(404).json({ error: "Tag not found" });
    if (existing.ownerId || existing.status !== QrTagStatus.PENDING_ACTIVATION) {
      return res.status(409).json({ error: "QR tag is not awaiting activation" });
    }
    if (!existing.activationCode || existing.activationCode !== input.activationCode) {
      return res.status(403).json({ error: "Invalid activation code" });
    }
    const activated = await prisma.qrTag.updateMany({
      where: {
        id: existing.id,
        ownerId: null,
        status: QrTagStatus.PENDING_ACTIVATION,
        deletedAt: null,
        activationCode: input.activationCode
      },
      data: { ownerId: req.user!.id, status: QrTagStatus.ACTIVE, activationCode: null }
    });
    if (!activated.count) return res.status(409).json({ error: "QR tag is not awaiting activation" });
    const tag = await prisma.qrTag.findUnique({
      where: { id: existing.id },
      include: { contactSetting: true }
    });
    res.json({ ok: true, tag: tag ? { ...tag, publicUrl: publicUrlFor(tag.publicSlug) } : null });
  })
);

app.post(
  "/tags/:id/disable",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await prisma.qrTag.updateMany({ where: { id: req.params.id, ownerId: req.user!.id }, data: { status: QrTagStatus.DISABLED } });
    res.json({ ok: true });
  })
);

app.post(
  "/tags/:id/transfer",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ phone: z.string() }).parse(req.body);
    const phone = normalizeBangladeshPhone(input.phone);
    const target = await prisma.user.findUnique({ where: { phone } });
    if (!target) return res.status(404).json({ error: "Target user must register first" });
    await prisma.qrTag.updateMany({ where: { id: req.params.id, ownerId: req.user!.id }, data: { ownerId: target.id, status: QrTagStatus.TRANSFERRED } });
    res.json({ ok: true });
  })
);

app.delete(
  "/tags/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await prisma.qrTag.updateMany({ where: { id: req.params.id, ownerId: req.user!.id }, data: { status: QrTagStatus.DELETED, deletedAt: new Date() } });
    res.json({ ok: true });
  })
);

app.get(
  "/tags/:id/scans",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const tag = await prisma.qrTag.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    const scans = await prisma.scanEvent.findMany({ where: { qrTagId: tag.id }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ scans });
  })
);

app.get(
  "/tags/:id/contact-requests",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const tag = await prisma.qrTag.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    const requests = await prisma.contactRequest.findMany({
      where: { qrTagId: tag.id, deletedAt: null },
      include: { messages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ requests });
  })
);

app.get(
  "/tags/:id/download-qr",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const tag = await prisma.qrTag.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    const format = req.query.format === "svg" ? "svg" : "png";
    if (format === "svg") {
      const svg = await QRCode.toString(publicUrlFor(tag.publicSlug), { type: "svg", margin: 2 });
      res.type("image/svg+xml").send(svg);
    } else {
      const png = await QRCode.toBuffer(publicUrlFor(tag.publicSlug), { type: "png", margin: 2, width: 768 });
      res.type("image/png").send(png);
    }
  })
);

app.get(
  "/t/:publicSlug",
  asyncRoute(async (req, res) => {
    const tag = await makeSafePublicTag(req.params.publicSlug);
    if (!tag) return res.status(404).json({ error: "QR tag not found" });
    res.json({ tag });
  })
);

app.get(
  "/qr/:publicSlug.:format",
  asyncRoute(async (req, res) => {
    const tag = await prisma.qrTag.findUnique({ where: { publicSlug: req.params.publicSlug } });
    if (!tag || tag.deletedAt) return res.status(404).json({ error: "QR tag not found" });
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (req.params.format === "svg") {
      const svg = await QRCode.toString(publicUrlFor(tag.publicSlug), { type: "svg", margin: 2 });
      return res.type("image/svg+xml").send(svg);
    }
    const png = await QRCode.toBuffer(publicUrlFor(tag.publicSlug), { type: "png", margin: 2, width: 768 });
    res.type("image/png").send(png);
  })
);

app.post(
  "/t/:publicSlug/scan",
  publicContactLimiter,
  asyncRoute(async (req, res) => {
    const tag = await prisma.qrTag.findUnique({ where: { publicSlug: req.params.publicSlug } });
    if (!tag) return res.status(404).json({ error: "QR tag not found" });
    if (!isPublicTagActive(tag)) return sendInactivePublicTag(res);
    await prisma.$transaction([
      prisma.scanEvent.create({
        data: {
          qrTagId: tag.id,
          ipHash: hashNetworkValue(req.ip),
          userAgentHash: hashNetworkValue(req.get("user-agent")),
          referrer: req.get("referer")
        }
      }),
      prisma.qrTag.update({
        where: { id: tag.id },
        data: { scanCount: { increment: 1 }, lastScannedAt: new Date() }
      })
    ]);
    if (tag.ownerId) {
      await prisma.notification.create({
        data: {
          userId: tag.ownerId,
          type: NotificationType.QR_SCANNED,
          title: "QR scanned",
          body: `${tag.label} was scanned.`,
          data: { qrTagId: tag.id }
        }
      });
    }
    res.json({ ok: true });
  })
);

app.post(
  "/t/:publicSlug/call",
  publicContactLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(publicCallStartSchema, req);
    const tag = await prisma.qrTag.findUnique({ where: { publicSlug: req.params.publicSlug } });
    if (!tag) return res.status(404).json({ error: "QR tag not found" });
    if (!isPublicTagActive(tag)) return sendInactivePublicTag(res);
    const callToken = randomToken(24);
    const callSession = await prisma.callSession.create({
      data: {
        qrTagId: tag.id,
        ownerId: tag.ownerId,
        scannerTokenHash: hashCallToken(callToken),
        scannerName: input.scannerName,
        status: CallSessionStatus.RINGING,
        expiresAt: nextCallRingExpiry()
      },
      include: { qrTag: { select: { id: true, label: true, type: true } } }
    });
    const notification = await prisma.notification.create({
      data: {
        userId: tag.ownerId,
        type: NotificationType.CONTACT_REQUEST,
        title: "Private call request",
        body: `Someone is calling about ${tag.label}.`,
        data: { callSessionId: callSession.id, qrTagId: tag.id, type: "private_call" }
      }
    });
    await sendOwnerPush(tag.ownerId, {
      title: notification.title,
      body: notification.body,
      data: {
        type: "private_call",
        actionType: "call",
        actionId: callSession.id,
        callSessionId: callSession.id,
        qrTagId: tag.id,
        route: `/call/${callSession.id}`
      }
    });
    debugLog("public.call.created", {
      publicSlug: shortId(tag.publicSlug),
      tagId: shortId(tag.id),
      ownerId: shortId(tag.ownerId),
      callSessionId: shortId(callSession.id),
      scannerNamePresent: Boolean(input.scannerName)
    });
    res.status(201).json({
      ok: true,
      callSessionId: callSession.id,
      callToken,
      callUrl: `${env.appUrl.replace(/\/$/, "")}/call/${callSession.id}?token=${callToken}`,
      callSession: callSessionDto(callSession)
    });
  })
);

app.get(
  "/public/calls/:id",
  asyncRoute(async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (token.length < 20) return sendCallUnavailable(res);
    const validation = await validateScannerCall(req.params.id, token);
    if (validation.result === "expired") return sendCallExpired(res);
    if (validation.result !== "active" || !validation.callSession) return sendCallUnavailable(res);
    res.json({ callSession: callSessionDto(validation.callSession) });
  })
);

app.get(
  "/public/calls/:id/signals",
  asyncRoute(async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (token.length < 20) return sendCallUnavailable(res);
    const validation = await validateScannerCall(req.params.id, token);
    if (validation.result === "expired") return sendCallExpired(res);
    if (validation.result !== "active" || !validation.callSession) return sendCallUnavailable(res);
    const signals = await prisma.callSignal.findMany({
      where: { callSessionId: validation.callSession.id, sender: CallSignalSender.OWNER },
      orderBy: { createdAt: "asc" },
      take: 200
    });
    res.json({ callSession: callSessionDto(validation.callSession), signals: signals.map(callSignalDto) });
  })
);

app.post(
  "/public/calls/:id/signals",
  publicContactLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(callSignalSchema.required({ token: true }), req);
    const validation = await validateScannerCall(req.params.id, input.token);
    if (validation.result === "expired") return sendCallExpired(res);
    if (validation.result !== "active" || !validation.callSession) return sendCallUnavailable(res);
    if (!new Set<CallSessionStatus>([CallSessionStatus.RINGING, CallSessionStatus.ACCEPTED]).has(validation.callSession.status)) {
      return res.status(409).json({ error: "This call is no longer active." });
    }
    const signal = await prisma.callSignal.create({
      data: {
        callSessionId: validation.callSession.id,
        sender: CallSignalSender.SCANNER,
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue
      }
    });
    res.status(201).json({ signal: callSignalDto(signal) });
  })
);

app.post(
  "/public/calls/:id/end",
  asyncRoute(async (req, res) => {
    const input = z.object({ token: z.string().min(20) }).parse(req.body);
    const validation = await validateScannerCall(req.params.id, input.token);
    if (validation.result === "expired") return sendCallExpired(res);
    if (validation.result !== "active" || !validation.callSession) return sendCallUnavailable(res);
    const callSession = await prisma.callSession.update({
      where: { id: validation.callSession.id },
      data: { status: CallSessionStatus.ENDED, endedAt: new Date() },
      include: { qrTag: { select: { id: true, label: true, type: true } } }
    });
    res.json({ ok: true, callSession: callSessionDto(callSession) });
  })
);

app.post(
  "/t/:publicSlug/contact",
  publicContactLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(contactRequestSchema, req);
    const tag = await prisma.qrTag.findUnique({ where: { publicSlug: req.params.publicSlug }, include: { contactSetting: true } });
    if (!tag) return res.status(404).json({ error: "QR tag not found" });
    if (!isPublicTagActive(tag)) return sendInactivePublicTag(res);
    if (tag.contactSetting && !tag.contactSetting.allowContactForm) return res.status(403).json({ error: "Contact form is disabled" });
    const replyToken = randomToken(24);
    const now = new Date();
    const expiresAt = nextConversationExpiry(now);
    const contactRequest = await prisma.contactRequest.create({
      data: {
        qrTagId: tag.id,
        ownerId: tag.ownerId,
        reason: input.reason,
        message: input.message,
        scannerName: input.scannerName,
        scannerContact: input.scannerContact,
        scannerIpHash: hashNetworkValue(req.ip),
        replyTokenHash: hashConversationToken(replyToken),
        status: ContactRequestStatus.OPEN,
        readAt: null,
        lastActivityAt: now,
        expiresAt,
        messages: {
          create: {
            sender: ContactMessageSender.SCANNER,
            senderName: input.scannerName,
            body: input.message,
            senderIpHash: hashNetworkValue(req.ip)
          }
        }
      }
    });
    const notification = await prisma.notification.create({
      data: {
        userId: tag.ownerId,
        type: NotificationType.CONTACT_REQUEST,
        title: "New contact request",
        body: `Someone sent a message about ${tag.label}.`,
        data: { contactRequestId: contactRequest.id, qrTagId: tag.id }
      }
    });
    await sendOwnerPush(tag.ownerId, {
      title: notification.title,
      body: notification.body,
      data: {
        type: "contact_request",
        actionType: "request",
        actionId: contactRequest.id,
        contactRequestId: contactRequest.id,
        qrTagId: tag.id,
        route: `/chat/${contactRequest.id}`
      }
    });
    debugLog("public.contact.created", {
      publicSlug: shortId(tag.publicSlug),
      tagId: shortId(tag.id),
      ownerId: shortId(tag.ownerId),
      contactRequestId: shortId(contactRequest.id),
      reason: input.reason,
      scannerNamePresent: Boolean(input.scannerName),
      messageLength: input.message.length
    });
    res.status(201).json({
      ok: true,
      contactRequestId: contactRequest.id,
      conversationToken: replyToken,
      expiresAt,
      conversationUrl: `${env.appUrl.replace(/\/$/, "")}/c/${contactRequest.id}?token=${replyToken}`
    });
  })
);

app.get(
  "/public/contact-requests/:id/messages",
  asyncRoute(async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (token.length < 20) return sendConversationUnavailable(res);
    const validation = await validateScannerConversation(req.params.id, token);
    if (validation.result === "expired") return sendConversationExpired(res);
    if (validation.result !== "active" || !validation.contactRequest) return sendConversationUnavailable(res);
    const contactRequest = validation.contactRequest;
    debugLog("public.contact.messages", {
      contactRequestId: shortId(contactRequest.id),
      tagId: shortId(contactRequest.qrTagId),
      count: contactRequest.messages.length
    });
    res.json({
      contactRequest: {
        id: contactRequest.id,
        reason: contactRequest.reason,
        status: contactRequest.status,
        tagLabel: contactRequest.qrTag.label,
        createdAt: contactRequest.createdAt,
        expiresAt: contactRequest.expiresAt
      },
      messages: contactRequest.messages.map(publicMessageDto)
    });
  })
);

app.get(
  "/public/contact-requests/:id/validate",
  asyncRoute(async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (token.length < 20) return sendConversationUnavailable(res);
    const validation = await validateScannerConversation(req.params.id, token);
    if (validation.result === "expired") return sendConversationExpired(res);
    if (validation.result !== "active" || !validation.contactRequest) return sendConversationUnavailable(res);
    res.json({
      ok: true,
      conversationId: validation.contactRequest.id,
      expiresAt: validation.contactRequest.expiresAt,
      status: validation.contactRequest.status
    });
  })
);

app.post(
  "/public/contact-requests/:id/messages",
  publicContactLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(publicChatMessageSchema, req);
    const validation = await validateScannerConversation(req.params.id, input.token);
    if (validation.result === "expired") return sendConversationExpired(res);
    if (validation.result !== "active" || !validation.contactRequest) return sendConversationUnavailable(res);
    const contactRequest = validation.contactRequest;
    const now = new Date();
    const expiresAt = nextConversationExpiry(now);
    const message = await prisma.contactMessage.create({
      data: {
        contactRequestId: contactRequest.id,
        sender: ContactMessageSender.SCANNER,
        senderName: input.senderName || contactRequest.scannerName,
        body: input.body,
        senderIpHash: hashNetworkValue(req.ip)
      }
    });
    await prisma.contactRequest.update({
      where: { id: contactRequest.id },
      data: {
        status: ContactRequestStatus.OPEN,
        readAt: null,
        lastActivityAt: now,
        expiresAt
      }
    });
    const notification = await prisma.notification.create({
      data: {
        userId: contactRequest.ownerId,
        type: NotificationType.CONTACT_REQUEST,
        title: "New chat message",
        body: `A scanner replied about ${contactRequest.qrTag.label}.`,
        data: { contactRequestId: contactRequest.id, qrTagId: contactRequest.qrTagId }
      }
    });
    await sendOwnerPush(contactRequest.ownerId, {
      title: notification.title,
      body: notification.body,
      data: {
        type: "contact_request",
        actionType: "request",
        actionId: contactRequest.id,
        contactRequestId: contactRequest.id,
        qrTagId: contactRequest.qrTagId,
        route: `/chat/${contactRequest.id}`
      }
    });
    debugLog("public.contact.reply", {
      contactRequestId: shortId(contactRequest.id),
      tagId: shortId(contactRequest.qrTagId),
      messageId: shortId(message.id),
      messageLength: input.body.length
    });
    res.status(201).json({ message: publicMessageDto(message) });
  })
);

app.post(
  "/t/:publicSlug/report-abuse",
  publicContactLimiter,
  asyncRoute(async (req, res) => {
    const input = z.object({ reason: z.string().min(3).max(120), details: z.string().max(500).optional(), reporterContact: z.string().max(100).optional() }).parse(req.body);
    const tag = await prisma.qrTag.findUnique({ where: { publicSlug: req.params.publicSlug } });
    const report = await prisma.abuseReport.create({
      data: { qrTagId: tag?.id, reason: input.reason, details: input.details, reporterContact: input.reporterContact }
    });
    if (tag?.ownerId) {
      await prisma.notification.create({
        data: {
          userId: tag.ownerId,
          type: NotificationType.ABUSE_REPORT,
          title: "Abuse report submitted",
          body: "A public visitor submitted an abuse report.",
          data: { reportId: report.id, qrTagId: tag.id }
        }
      });
    }
    res.status(201).json({ ok: true, reportId: report.id });
  })
);

app.get(
  "/contact-requests",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await expireInactiveConversationsForOwner(req.user!.id);
    const requests = await prisma.contactRequest.findMany({
      where: { ownerId: req.user!.id, deletedAt: null },
      include: { qrTag: true, messages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ requests });
  })
);

app.patch(
  "/contact-requests/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ status: z.nativeEnum(ContactRequestStatus) }).parse(req.body);
    const now = new Date();
    const request = await prisma.contactRequest.updateMany({
      where: { id: req.params.id, ownerId: req.user!.id },
      data: {
        status: input.status,
        closedAt: input.status === ContactRequestStatus.CLOSED ? now : undefined,
        deleteAt: input.status === ContactRequestStatus.CLOSED ? nextConversationDeleteAt(now) : undefined
      }
    });
    res.json({ ok: request.count > 0 });
  })
);

app.get(
  "/contact-requests/:id/messages",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const contactRequest = await prisma.contactRequest.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null },
      include: {
        qrTag: true,
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" }
        }
      }
    });
    if (!contactRequest) return res.status(404).json({ error: "Contact request not found" });
    const lifecycle = await expireConversationIfNeeded(contactRequest);
    res.json({ contactRequest: lifecycle.contactRequest, messages: contactRequest.messages });
  })
);

app.post(
  "/contact-requests/:id/messages",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = parseBody(chatMessageSchema, req);
    const contactRequest = await prisma.contactRequest.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null }
    });
    if (!contactRequest) return res.status(404).json({ error: "Contact request not found" });
    const lifecycle = await expireConversationIfNeeded(contactRequest);
    if (!isConversationReplyAllowed(lifecycle.contactRequest)) {
      return res.status(410).json({
        code: "CONVERSATION_EXPIRED",
        message: "This conversation has expired. The scanner must scan the QR again to start a new chat."
      });
    }
    const now = new Date();
    const expiresAt = nextConversationExpiry(now);
    const message = await prisma.contactMessage.create({
      data: {
        contactRequestId: contactRequest.id,
        sender: ContactMessageSender.OWNER,
        senderUserId: req.user!.id,
        senderName: req.user!.fullName || "Owner",
        body: input.body
      }
    });
    await prisma.contactRequest.update({
      where: { id: contactRequest.id },
      data: {
        status: ContactRequestStatus.OPEN,
        readAt: new Date(),
        lastActivityAt: now,
        expiresAt
      }
    });
    res.status(201).json({ message });
  })
);

app.get(
  "/public/products",
  asyncRoute(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { createdAt: "asc" }
    });
    res.json({ products: products.map(publicProductDto) });
  })
);

app.get(
  "/public/products/:slug",
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: {
        slug: req.params.slug,
        active: true,
        deletedAt: null
      }
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product: publicProductDto(product) });
  })
);

app.post(
  "/public/orders",
  publicOrderLimiter,
  asyncRoute(async (req, res) => {
    const input = parseBody(publicOrderSchema, req);
    if (!input.productId && !input.productSlug) {
      return res.status(400).json({ error: "Choose a QR tag product before checkout." });
    }
    const product = await prisma.product.findFirst({
      where: {
        active: true,
        deletedAt: null,
        OR: [
          ...(input.productId ? [{ id: input.productId }] : []),
          ...(input.productSlug ? [{ slug: input.productSlug }] : [])
        ]
      }
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const customerPhone = normalizeBangladeshPhone(input.phone);
    const existingUser = await prisma.user.findUnique({ where: { phone: customerPhone } });
    if (existingUser?.deletedAt || existingUser?.status === UserStatus.DELETED) {
      return res.status(403).json({ error: "This phone number cannot be used. Please contact support." });
    }
    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: existingUser.fullName || input.customerName,
            status: existingUser.status
          }
        })
      : await prisma.user.create({
          data: {
            phone: customerPhone,
            fullName: input.customerName,
            language: Language.EN,
            status: UserStatus.ACTIVE,
            profile: {
              create: {
                privacySettings: { phoneVisible: false, nameVisible: false, emergencyVisible: false },
                notificationSettings: { scanAlerts: false, contactRequestAlerts: true }
              }
            }
          }
        });
    await ensureRole(user.id, RoleName.USER);

    const quantity = input.quantity ?? 1;
    const subtotalBdt = product.priceBdt * quantity;
    const deliveryFeeBdt = subtotalBdt >= 1000 ? 0 : 80;
    const totalBdt = subtotalBdt + deliveryFeeBdt;
    const notes = [
      input.tagLabel ? `Tag label: ${input.tagLabel}` : null,
      input.vehicleNumber ? `Vehicle number: ${input.vehicleNumber}` : null,
      input.note ? `Customer note: ${input.note}` : null,
      "Public website COD order"
    ]
      .filter(Boolean)
      .join("\n");

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        userId: user.id,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.COD_PENDING,
        paymentMethod: PaymentMethod.COD,
        subtotalBdt,
        deliveryFeeBdt,
        totalBdt,
        customerName: input.customerName,
        customerPhone,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        deliveryDistrict: input.deliveryDistrict,
        notes,
        items: {
          create: {
            productId: product.id,
            name: product.name,
            quantity,
            unitPriceBdt: product.priceBdt,
            totalBdt: subtotalBdt
          }
        }
      },
      include: { items: true }
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "manual-cod",
        method: PaymentMethod.COD,
        status: PaymentStatus.COD_PENDING,
        amountBdt: totalBdt
      }
    });
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.ORDER_CREATED,
        title: "Order created",
        body: `Order ${order.orderNumber} was created.`,
        data: { orderId: order.id }
      }
    });

    res.status(201).json({ order: publicOrderDto(order) });
  })
);

app.get(
  "/public/orders/:trackingCode",
  asyncRoute(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: req.params.trackingCode,
        deletedAt: null
      },
      include: { items: true }
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ order: publicOrderDto(order) });
  })
);

app.get(
  "/products",
  asyncRoute(async (_req, res) => {
    const products = await prisma.product.findMany({ where: { active: true, deletedAt: null }, include: { variants: true }, orderBy: { createdAt: "asc" } });
    res.json({ products });
  })
);

app.get(
  "/products/:id",
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }], active: true, deletedAt: null }, include: { variants: true } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  })
);

app.get(
  "/cart",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const cart = await prisma.cart.upsert({
      where: { userId: req.user!.id },
      update: {},
      create: { userId: req.user!.id },
      include: { items: { include: { product: true, productVariant: true } } }
    });
    res.json({ cart });
  })
);

app.post(
  "/cart/items",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ productId: z.string(), productVariantId: z.string().optional(), quantity: z.number().int().min(1).max(100).default(1) }).parse(req.body);
    const [cart, product, variant] = await Promise.all([
      prisma.cart.upsert({ where: { userId: req.user!.id }, update: {}, create: { userId: req.user!.id } }),
      prisma.product.findUnique({ where: { id: input.productId } }),
      input.productVariantId ? prisma.productVariant.findUnique({ where: { id: input.productVariantId } }) : Promise.resolve(null)
    ]);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id, productVariantId: variant?.id ?? null }
    });
    const item = existing
      ? await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: { increment: input.quantity } } })
      : await prisma.cartItem.create({
          data: { cartId: cart.id, productId: product.id, productVariantId: variant?.id, quantity: input.quantity, unitPriceBdt: variant?.priceBdt || product.priceBdt }
        });
    res.status(201).json({ item });
  })
);

app.patch(
  "/cart/items/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ quantity: z.number().int().min(1).max(100) }).parse(req.body);
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    const item = await prisma.cartItem.updateMany({ where: { id: req.params.id, cartId: cart.id }, data: { quantity: input.quantity } });
    res.json({ ok: item.count > 0 });
  })
);

app.delete(
  "/cart/items/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (cart) await prisma.cartItem.deleteMany({ where: { id: req.params.id, cartId: cart.id } });
    res.json({ ok: true });
  })
);

app.delete(
  "/cart",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ ok: true });
  })
);

async function resolveOrderItems(userId: string | undefined, bodyItems?: Array<{ productId: string; productVariantId?: string; quantity?: number }>) {
  const sourceItems =
    bodyItems && bodyItems.length
      ? bodyItems
      : userId
        ? (await prisma.cart.findUnique({ where: { userId }, include: { items: true } }))?.items.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId || undefined,
            quantity: item.quantity
          })) || []
        : [];
  if (!sourceItems.length) throw Object.assign(new Error("Order requires at least one item"), { statusCode: 400 });
  const hydrated = [];
  for (const item of sourceItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    const variant = item.productVariantId ? await prisma.productVariant.findUnique({ where: { id: item.productVariantId } }) : null;
    if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });
    const unitPriceBdt = variant?.priceBdt || product.priceBdt;
    const quantity = item.quantity ?? 1;
    hydrated.push({ product, variant, quantity, unitPriceBdt, totalBdt: unitPriceBdt * quantity });
  }
  return hydrated;
}

app.post(
  "/orders",
  asyncRoute(async (req: AuthedRequest, res) => {
    const bearer = req.get("authorization");
    if (bearer?.startsWith("Bearer ")) {
      try {
        await new Promise<void>((resolve, reject) => requireAuth(req, res, (error) => (error ? reject(error) : resolve())));
      } catch {
        req.user = undefined;
      }
    }
    const input = parseBody(orderSchema, req);
    const customerPhone = normalizeBangladeshPhone(input.customerPhone);
    const items = await resolveOrderItems(req.user?.id, input.items);
    const subtotalBdt = items.reduce((sum, item) => sum + item.totalBdt, 0);
    const deliveryFeeBdt = subtotalBdt >= 1000 ? 0 : 80;
    const totalBdt = subtotalBdt + deliveryFeeBdt;
    const orderNumber = `SCBD-${Date.now().toString(36).toUpperCase()}`;
    const paymentMethod = input.paymentMethod ?? PaymentMethod.COD;
    const provider = paymentProviders[paymentMethod];
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user?.id,
        status: OrderStatus.PENDING,
        paymentStatus: paymentMethod === PaymentMethod.COD ? PaymentStatus.COD_PENDING : PaymentStatus.PENDING,
        paymentMethod,
        subtotalBdt,
        deliveryFeeBdt,
        totalBdt,
        customerName: input.customerName,
        customerPhone,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        deliveryDistrict: input.deliveryDistrict,
        notes: input.notes,
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            productVariantId: item.variant?.id,
            name: item.variant ? `${item.product.name} - ${item.variant.name}` : item.product.name,
            quantity: item.quantity,
            unitPriceBdt: item.unitPriceBdt,
            totalBdt: item.totalBdt
          }))
        }
      },
      include: { items: true }
    });
    const paymentIntent = await provider.createPayment({ orderId: order.id, amountBdt: totalBdt });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider.getProviderName(),
        method: paymentMethod,
        status: paymentMethod === PaymentMethod.COD ? PaymentStatus.COD_PENDING : PaymentStatus.PENDING,
        amountBdt: totalBdt,
        providerRef: paymentIntent.providerRef
      }
    });
    if (req.user?.id) {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          type: NotificationType.ORDER_CREATED,
          title: "Order created",
          body: `Order ${order.orderNumber} was created.`,
          data: { orderId: order.id }
        }
      });
      const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.status(201).json({ order, payment: paymentIntent });
  })
);

app.get(
  "/orders",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const orders = await prisma.order.findMany({ where: { userId: req.user!.id }, include: { items: true, payments: true }, orderBy: { createdAt: "desc" } });
    res.json({ orders });
  })
);

app.get(
  "/orders/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.id }, include: { items: true, payments: true, shipments: true } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ order });
  })
);

app.post(
  "/orders/:id/pay",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    const provider = paymentProviders[order.paymentMethod];
    const payment = await provider.createPayment({ orderId: order.id, amountBdt: order.totalBdt });
    res.json({ payment });
  })
);

app.post(
  "/orders/:id/cancel",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const order = await prisma.order.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { status: OrderStatus.CANCELLED } });
    res.json({ ok: order.count > 0 });
  })
);

app.get(
  "/owner/me",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: "Owner not found" });
    debugLog("owner.me", { ownerId: shortId(user.id), phone: maskPhone(user.phone), namePresent: Boolean(user.fullName) });
    res.json({ owner: ownerDto(user), user: safeUserDto(user) });
  })
);

app.patch(
  "/owner/me",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = updateProfileSchema.pick({ fullName: true, email: true }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { fullName: input.fullName, email: input.email } });
    res.json({ owner: ownerDto(user), user: safeUserDto(user) });
  })
);

app.get(
  "/owner/dashboard",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await expireInactiveConversationsForOwner(req.user!.id);
    const [tags, requests, unreadRequestCount, unreadNotifications, latestOrder] = await Promise.all([
      prisma.qrTag.findMany({ where: { ownerId: req.user!.id, deletedAt: null }, orderBy: { createdAt: "desc" } }),
      prisma.contactRequest.findMany({
        where: { ownerId: req.user!.id, deletedAt: null },
        include: { qrTag: { select: { id: true, label: true } } },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 3
      }),
      prisma.contactRequest.count({ where: { ownerId: req.user!.id, deletedAt: null, status: ContactRequestStatus.OPEN, readAt: null } }),
      prisma.notification.count({ where: { userId: req.user!.id, readAt: null, deletedAt: null } }),
      prisma.order.findFirst({ where: { userId: req.user!.id, deletedAt: null }, include: { items: true }, orderBy: { createdAt: "desc" } })
    ]);
    const activeQrCount = tags.filter((tag) => tag.status === QrTagStatus.ACTIVE).length;
    debugLog("owner.dashboard", {
      ownerId: shortId(req.user!.id),
      phone: maskPhone(req.user!.phone),
      tags: tags.length,
      activeQrCount,
      totalScanCount: tags.reduce((sum, tag) => sum + tag.scanCount, 0),
      unreadRequestCount,
      recentRequests: requests.length,
      unreadNotifications,
      latestOrder: Boolean(latestOrder)
    });
    res.json({
      activeQrCount,
      totalScanCount: tags.reduce((sum, tag) => sum + tag.scanCount, 0),
      unreadRequestCount,
      unreadNotificationCount: unreadNotifications,
      hasAssignedQr: tags.length > 0,
      recentRequests: requests.map(ownerRequestDto),
      latestOrder: latestOrder ? ownerOrderDto(latestOrder) : null
    });
  })
);

app.get(
  "/owner/tags",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const tags = await prisma.qrTag.findMany({ where: { ownerId: req.user!.id, deletedAt: null }, orderBy: { createdAt: "desc" } });
    debugLog("owner.tags", { ownerId: shortId(req.user!.id), phone: maskPhone(req.user!.phone), count: tags.length });
    res.json({ tags: tags.map(ownerTagDto) });
  })
);

app.get(
  "/owner/contact-requests",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await expireInactiveConversationsForOwner(req.user!.id);
    const filter = z.enum(["all", "unread", "open", "closed"]).default("all").parse(req.query.filter || "all");
    const statusWhere =
      filter === "unread"
        ? { status: ContactRequestStatus.OPEN, readAt: null }
        : filter === "closed"
          ? { status: { in: [ContactRequestStatus.EXPIRED, ContactRequestStatus.CLOSED] } }
          : filter === "open"
            ? { status: ContactRequestStatus.OPEN }
            : {};
    const requests = await prisma.contactRequest.findMany({
      where: { ownerId: req.user!.id, deletedAt: null, ...statusWhere },
      include: { qrTag: { select: { id: true, label: true } } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 100
    });
    debugLog("owner.contactRequests", { ownerId: shortId(req.user!.id), phone: maskPhone(req.user!.phone), filter, count: requests.length });
    res.json({ requests: requests.map(ownerRequestDto) });
  })
);

app.get(
  "/owner/contact-requests/:id/messages",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const contactRequest = await prisma.contactRequest.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null },
      include: { qrTag: { select: { id: true, label: true } }, messages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } } }
    });
    if (!contactRequest) return res.status(404).json({ error: "Contact request not found" });
    const lifecycle = await expireConversationIfNeeded(contactRequest);
    debugLog("owner.contactRequest.messages", {
      ownerId: shortId(req.user!.id),
      requestId: shortId(req.params.id),
      messageCount: contactRequest.messages.length
    });
    res.json({ request: ownerRequestDto(lifecycle.contactRequest), messages: contactRequest.messages.map(ownerMessageDto) });
  })
);

app.post(
  "/owner/contact-requests/:id/reply",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ message: z.string().trim().min(1).max(500) }).parse(req.body);
    const contactRequest = await prisma.contactRequest.findFirst({ where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null }, include: { qrTag: true } });
    if (!contactRequest) return res.status(404).json({ error: "Contact request not found" });
    const lifecycle = await expireConversationIfNeeded(contactRequest);
    if (!isConversationReplyAllowed(lifecycle.contactRequest)) {
      return res.status(410).json({
        code: "CONVERSATION_EXPIRED",
        message: "This conversation has expired. The scanner must scan the QR again to start a new chat."
      });
    }
    const now = new Date();
    const expiresAt = nextConversationExpiry(now);
    const message = await prisma.contactMessage.create({
      data: {
        contactRequestId: contactRequest.id,
        sender: ContactMessageSender.OWNER,
        senderUserId: req.user!.id,
        senderName: "Owner",
        body: input.message
      }
    });
    await prisma.contactRequest.update({
      where: { id: contactRequest.id },
      data: {
        status: ContactRequestStatus.OPEN,
        readAt: new Date(),
        lastActivityAt: now,
        expiresAt
      }
    });
    debugLog("owner.contactRequest.reply", {
      ownerId: shortId(req.user!.id),
      requestId: shortId(contactRequest.id),
      messageId: shortId(message.id),
      messageLength: input.message.length
    });
    res.status(201).json({ message: ownerMessageDto(message) });
  })
);

app.post(
  "/owner/contact-requests/:id/mark-read",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const result = await prisma.contactRequest.updateMany({ where: { id: req.params.id, ownerId: req.user!.id }, data: { readAt: new Date() } });
    debugLog("owner.contactRequest.markRead", { ownerId: shortId(req.user!.id), requestId: shortId(req.params.id), updated: result.count });
    res.json({ ok: result.count > 0 });
  })
);

app.get(
  "/owner/calls/incoming",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await expireInactiveCallsForOwner(req.user!.id);
    const calls = await prisma.callSession.findMany({
      where: {
        ownerId: req.user!.id,
        deletedAt: null,
        status: { in: [CallSessionStatus.RINGING, CallSessionStatus.ACCEPTED] }
      },
      include: { qrTag: { select: { id: true, label: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    });
    res.json({ calls: calls.map(callSessionDto) });
  })
);

app.get(
  "/owner/calls/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const callSession = await prisma.callSession.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null },
      include: { qrTag: { select: { id: true, label: true, type: true } } }
    });
    if (!callSession) return res.status(404).json({ error: "Call not found" });
    const lifecycle = await expireCallIfNeeded(callSession);
    if (lifecycle.expired || lifecycle.callSession.status === CallSessionStatus.EXPIRED) return sendCallExpired(res);
    res.json({ callSession: callSessionDto(lifecycle.callSession) });
  })
);

app.post(
  "/owner/calls/:id/accept",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const callSession = await prisma.callSession.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null },
      include: { qrTag: { select: { id: true, label: true, type: true } } }
    });
    if (!callSession) return res.status(404).json({ error: "Call not found" });
    const lifecycle = await expireCallIfNeeded(callSession);
    if (lifecycle.expired || lifecycle.callSession.status === CallSessionStatus.EXPIRED) return sendCallExpired(res);
    if (lifecycle.callSession.status !== CallSessionStatus.RINGING && lifecycle.callSession.status !== CallSessionStatus.ACCEPTED) {
      return res.status(409).json({ error: "This call is no longer active." });
    }
    const now = new Date();
    const updated = await prisma.callSession.update({
      where: { id: callSession.id },
      data: { status: CallSessionStatus.ACCEPTED, acceptedAt: lifecycle.callSession.acceptedAt ?? now, expiresAt: nextCallActiveExpiry(now) },
      include: { qrTag: { select: { id: true, label: true, type: true } } }
    });
    res.json({ callSession: callSessionDto(updated) });
  })
);

app.post(
  "/owner/calls/:id/decline",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const result = await prisma.callSession.updateMany({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null, status: { in: [CallSessionStatus.RINGING, CallSessionStatus.ACCEPTED] } },
      data: { status: CallSessionStatus.DECLINED, endedAt: new Date() }
    });
    res.json({ ok: result.count > 0 });
  })
);

app.post(
  "/owner/calls/:id/end",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const result = await prisma.callSession.updateMany({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null, status: { in: [CallSessionStatus.RINGING, CallSessionStatus.ACCEPTED] } },
      data: { status: CallSessionStatus.ENDED, endedAt: new Date() }
    });
    res.json({ ok: result.count > 0 });
  })
);

app.get(
  "/owner/calls/:id/signals",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const callSession = await prisma.callSession.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null },
      include: { qrTag: { select: { id: true, label: true, type: true } } }
    });
    if (!callSession) return res.status(404).json({ error: "Call not found" });
    const lifecycle = await expireCallIfNeeded(callSession);
    if (lifecycle.expired || lifecycle.callSession.status === CallSessionStatus.EXPIRED) return sendCallExpired(res);
    const signals = await prisma.callSignal.findMany({
      where: { callSessionId: callSession.id, sender: CallSignalSender.SCANNER },
      orderBy: { createdAt: "asc" },
      take: 200
    });
    res.json({ callSession: callSessionDto(lifecycle.callSession), signals: signals.map(callSignalDto) });
  })
);

app.post(
  "/owner/calls/:id/signals",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = parseBody(callSignalSchema.omit({ token: true }), req);
    const callSession = await prisma.callSession.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id, deletedAt: null },
      include: { qrTag: { select: { id: true, label: true, type: true } } }
    });
    if (!callSession) return res.status(404).json({ error: "Call not found" });
    const lifecycle = await expireCallIfNeeded(callSession);
    if (lifecycle.expired || lifecycle.callSession.status === CallSessionStatus.EXPIRED) return sendCallExpired(res);
    if (lifecycle.callSession.status !== CallSessionStatus.ACCEPTED) {
      return res.status(409).json({ error: "Accept the call before sending call signals." });
    }
    const signal = await prisma.callSignal.create({
      data: {
        callSessionId: callSession.id,
        sender: CallSignalSender.OWNER,
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue
      }
    });
    res.status(201).json({ signal: callSignalDto(signal) });
  })
);

app.get(
  "/owner/notifications",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ notifications: notifications.map(ownerNotificationDto) });
  })
);

app.post(
  "/owner/notifications/:id/read",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const result = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { readAt: new Date() } });
    res.json({ ok: result.count > 0 });
  })
);

app.post(
  "/owner/notifications/read-all",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, readAt: null, deletedAt: null }, data: { readAt: new Date() } });
    res.json({ ok: true });
  })
);

app.get(
  "/owner/products",
  requireAuth,
  asyncRoute(async (_req, res) => {
    const products = await prisma.product.findMany({ where: { active: true, deletedAt: null }, orderBy: { createdAt: "asc" } });
    res.json({ products: products.map(ownerProductDto) });
  })
);

app.post(
  "/owner/orders/cod",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z
      .object({
        productId: z.string(),
        receiverName: z.string().trim().min(2).max(100),
        receiverPhone: z.string().min(8),
        deliveryAddress: z.string().trim().min(5).max(240),
        city: z.string().trim().min(1).max(80),
        district: z.string().trim().min(1).max(80)
      })
      .parse(req.body);
    const product = await prisma.product.findFirst({ where: { id: input.productId, active: true, deletedAt: null } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    const customerPhone = normalizeBangladeshPhone(input.receiverPhone);
    const subtotalBdt = product.priceBdt;
    const deliveryFeeBdt = subtotalBdt >= 1000 ? 0 : 80;
    const totalBdt = subtotalBdt + deliveryFeeBdt;
    const order = await prisma.order.create({
      data: {
        orderNumber: `SCBD-${Date.now().toString(36).toUpperCase()}`,
        userId: req.user!.id,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.COD_PENDING,
        paymentMethod: PaymentMethod.COD,
        subtotalBdt,
        deliveryFeeBdt,
        totalBdt,
        customerName: input.receiverName,
        customerPhone,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.city,
        deliveryDistrict: input.district,
        items: {
          create: {
            productId: product.id,
            name: product.name,
            quantity: 1,
            unitPriceBdt: product.priceBdt,
            totalBdt: product.priceBdt
          }
        }
      },
      include: { items: true }
    });
    await prisma.payment.create({
      data: { orderId: order.id, provider: "manual-cod", method: PaymentMethod.COD, status: PaymentStatus.COD_PENDING, amountBdt: totalBdt }
    });
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: NotificationType.ORDER_CREATED,
        title: "Order created",
        body: `Order ${order.orderNumber} was created.`,
        data: { orderId: order.id }
      }
    });
    res.status(201).json(ownerOrderDto(order));
  })
);

app.get(
  "/owner/orders",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const orders = await prisma.order.findMany({ where: { userId: req.user!.id, deletedAt: null }, include: { items: true }, orderBy: { createdAt: "desc" } });
    res.json({ orders: orders.map(ownerOrderDto) });
  })
);

app.get(
  "/owner/orders/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.id, deletedAt: null }, include: { items: true, payments: true, shipments: true } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ order: ownerOrderDto(order) });
  })
);

app.post(
  "/payments/create",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ orderId: z.string(), method: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD) }).parse(req.body);
    const order = await prisma.order.findFirst({ where: { id: input.orderId, userId: req.user!.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    const provider = paymentProviders[input.method];
    const payment = await provider.createPayment({ orderId: order.id, amountBdt: order.totalBdt });
    res.json({ payment });
  })
);

app.post(
  "/payments/webhook/:provider",
  asyncRoute(async (req, res) => {
    const providerName = req.params.provider.toUpperCase() as keyof typeof paymentProviders;
    const provider = paymentProviders[providerName] || new PlaceholderPaymentProvider(req.params.provider);
    const result = await provider.handleWebhook(req.body);
    res.json(result);
  })
);

app.get(
  "/payments/:id",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const payment = await prisma.payment.findFirst({ where: { id: req.params.id, order: { userId: req.user!.id } } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json({ payment });
  })
);

app.get(
  "/admin/dashboard",
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN, RoleName.ORDER_MANAGER),
  asyncRoute(async (_req, res) => {
    const [totalUsers, activeUsers, activeTags, totalScans, contactRequests, pendingOrders, abuseReports, resellerApplications, societies] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: UserStatus.ACTIVE } }),
      prisma.qrTag.count({ where: { status: QrTagStatus.ACTIVE, deletedAt: null } }),
      prisma.scanEvent.count(),
      prisma.contactRequest.count({ where: { deletedAt: null } }),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.abuseReport.count({ where: { status: AbuseReportStatus.OPEN } }),
      prisma.reseller.count({ where: { status: ResellerStatus.APPLIED } }),
      prisma.society.count({ where: { deletedAt: null } })
    ]);
    const revenue = await prisma.order.aggregate({ _sum: { totalBdt: true }, where: { paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.COD_COLLECTED] } } });
    res.json({
      metrics: {
        totalUsers,
        activeUsers,
        activeTags,
        totalScans,
        contactRequests,
        pendingOrders,
        revenueBdt: revenue._sum.totalBdt || 0,
        codPending: await prisma.order.count({ where: { paymentStatus: PaymentStatus.COD_PENDING } }),
        abuseReports,
        resellerApplications,
        societies
      }
    });
  })
);

app.get("/admin/users", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (_req, res) => {
  const users = await prisma.user.findMany({
    include: { userRoles: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({ users: users.map((user) => safeAdminUserDto(user)) });
}));
app.get("/admin/users/:id", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { profile: true, userRoles: { include: { role: true } } } });
  res.json({ user: safeAdminUserDto(user) });
}));
app.patch("/admin/users/:id", requireAuth, requireRoles(RoleName.SUPER_ADMIN), asyncRoute(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body,
    include: { profile: true, userRoles: { include: { role: true } } }
  });
  res.json({ user: safeAdminUserDto(user) });
}));
app.delete("/admin/users/:id", requireAuth, requireRoles(RoleName.SUPER_ADMIN), asyncRoute(async (req: AuthedRequest, res) => {
  if (req.params.id === req.user!.id) return res.status(400).json({ error: "You cannot delete your own admin account" });
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { userRoles: { include: { role: true } } }
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.userRoles.some((entry) => entry.role.name === RoleName.SUPER_ADMIN)) {
    return res.status(400).json({ error: "Super admin accounts cannot be deleted from this screen" });
  }
  await prisma.$transaction(async (tx) => {
    const ownedTags = await tx.qrTag.findMany({ where: { ownerId: user.id }, select: { id: true } });
    const ownedTagIds = ownedTags.map((tag) => tag.id);
    if (ownedTagIds.length) await tx.qrTag.deleteMany({ where: { id: { in: ownedTagIds } } });
    await tx.order.deleteMany({
      where: {
        OR: [
          { userId: user.id },
          { customerPhone: user.phone }
        ]
      }
    });
    await tx.user.delete({ where: { id: user.id } });
  });
  await audit(req, "ADMIN_DELETE_USER", "User", user.id, { phone: user.phone, email: user.email });
  res.json({ ok: true });
}));
app.get("/admin/owners", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (_req, res) => {
  const owners = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ownedTags: { some: { deletedAt: null } } },
        { contactRequests: { some: { deletedAt: null } } },
        { orders: { some: { deletedAt: null } } }
      ]
    },
    include: {
      ownedTags: {
        where: { deletedAt: null },
        select: { id: true, publicSlug: true, type: true, label: true, status: true, scanCount: true, createdAt: true, _count: { select: { abuseReports: true } } },
        orderBy: { createdAt: "desc" }
      },
      contactRequests: {
        where: { deletedAt: null },
        select: { id: true, status: true, readAt: true, createdAt: true },
        orderBy: { createdAt: "desc" }
      },
      orders: {
        where: { deletedAt: null },
        select: { id: true, status: true, paymentStatus: true, createdAt: true },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({
    owners: owners.map((owner) => ({
      id: owner.id,
      phone: owner.phone,
      fullName: owner.fullName,
      createdAt: owner.createdAt,
      tagCount: owner.ownedTags.length,
      contactRequestCount: owner.contactRequests.length,
      unreadRequestCount: owner.contactRequests.filter((request) => request.status === ContactRequestStatus.OPEN && !request.readAt).length,
      orderCount: owner.orders.length,
      pendingOrderCount: owner.orders.filter((order) => !new Set<OrderStatus>([OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED]).has(order.status)).length,
      abuseReportCount: owner.ownedTags.reduce((sum, tag) => sum + tag._count.abuseReports, 0),
      latestRequestAt: owner.contactRequests[0]?.createdAt ?? null,
      tags: owner.ownedTags.map((tag) => ({ ...tag, publicUrl: publicUrlFor(tag.publicSlug) }))
    }))
  });
}));
app.get("/admin/owners/:ownerId", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (req: AuthedRequest, res) => {
  const owner = await prisma.user.findFirst({
    where: { id: req.params.ownerId, deletedAt: null },
    include: {
      ownedTags: {
        where: { deletedAt: null },
        include: { contactSetting: true },
        orderBy: { createdAt: "desc" }
      },
      orders: {
        where: { deletedAt: null },
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" }
      },
      contactRequests: {
        where: { deletedAt: null },
        include: {
          qrTag: { select: { id: true, publicSlug: true, type: true, label: true, status: true } },
          messages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!owner) return res.status(404).json({ error: "Owner not found" });
  await audit(req, "ADMIN_VIEW_OWNER_MESSAGES", "User", owner.id, { ownerPhone: owner.phone });
  res.json({
    owner: {
      id: owner.id,
      phone: owner.phone,
      fullName: owner.fullName,
      createdAt: owner.createdAt
    },
    tags: owner.ownedTags.map((tag) => ({ ...tag, publicUrl: publicUrlFor(tag.publicSlug) })),
    orders: owner.orders,
    requests: owner.contactRequests
  });
}));
app.get("/admin/tags", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (_req, res) => res.json({ tags: await prisma.qrTag.findMany({ include: { owner: true, contactSetting: true }, orderBy: { createdAt: "desc" }, take: 100 }) })));
app.post("/admin/tags", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (req: AuthedRequest, res) => {
  const input = parseBody(adminCreateTagSchema, req);
  const ownerPhone = normalizeBangladeshPhone(input.ownerPhone);
  debugLog("admin.tags.create.start", {
    actorId: shortId(req.user!.id),
    ownerPhone: maskPhone(ownerPhone),
    ownerNamePresent: Boolean(input.ownerName),
    type: input.type,
    labelPresent: Boolean(input.label),
    vehiclePresent: Boolean(input.vehicleNumber)
  });
  const owner = await prisma.user.upsert({
    where: { phone: ownerPhone },
    update: { fullName: input.ownerName },
    create: {
      phone: ownerPhone,
      fullName: input.ownerName,
      profile: { create: {} }
    }
  });
  await ensureRole(owner.id, RoleName.USER);
  debugLog("admin.tags.create.ownerReady", { ownerId: shortId(owner.id), ownerPhone: maskPhone(owner.phone), newlyCreatedOrUpdated: true });
  const tag = await prisma.qrTag.create({
    data: {
      publicSlug: createPublicSlug(),
      ownerId: owner.id,
      createdById: req.user!.id,
      type: input.type,
      label: input.label,
      vehicleNumber: input.vehicleNumber,
      itemName: input.itemName,
      privacyMode: input.privacyMode,
      status: QrTagStatus.ACTIVE,
      contactSetting: { create: input.contactSettings }
    },
    include: { owner: true, contactSetting: true }
  });
  debugLog("admin.tags.create.success", {
    actorId: shortId(req.user!.id),
    ownerId: shortId(owner.id),
    tagId: shortId(tag.id),
    slug: shortId(tag.publicSlug),
    publicUrl: publicUrlFor(tag.publicSlug)
  });
  await audit(req, "ADMIN_CREATE_OWNER_QR_TAG", "QrTag", tag.id, { ownerPhone, ownerId: owner.id });
  res.status(201).json({ tag: { ...tag, publicUrl: publicUrlFor(tag.publicSlug) } });
}));
app.get("/admin/tags/:id", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (req, res) => {
  const tag = await prisma.qrTag.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      owner: true,
      contactSetting: true,
      scanEvents: { orderBy: { createdAt: "desc" }, take: 10 },
      contactRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      abuseReports: { orderBy: { createdAt: "desc" }, take: 10 }
    }
  });
  if (!tag) return res.status(404).json({ error: "Tag not found" });
  res.json({ tag: { ...tag, publicUrl: publicUrlFor(tag.publicSlug) } });
}));
app.patch("/admin/tags/:id", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (req: AuthedRequest, res) => {
  const input = z.object({ status: z.nativeEnum(QrTagStatus).optional(), label: z.string().min(2).max(80).optional() }).passthrough().parse(req.body);
  const tag = await prisma.qrTag.update({ where: { id: req.params.id }, data: input });
  await audit(req, "ADMIN_UPDATE_QR_TAG", "QrTag", tag.id, { status: tag.status, label: tag.label });
  res.json({ tag: { ...tag, publicUrl: publicUrlFor(tag.publicSlug) } });
}));
app.get("/admin/orders", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.ORDER_MANAGER), asyncRoute(async (_req, res) => res.json({ orders: await prisma.order.findMany({ include: { user: true, items: true, payments: true }, orderBy: { createdAt: "desc" }, take: 100 }) })));
app.patch("/admin/orders/:id", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.ORDER_MANAGER), asyncRoute(async (req: AuthedRequest, res) => {
  const input = z.object({ status: z.nativeEnum(OrderStatus).optional(), paymentStatus: z.nativeEnum(PaymentStatus).optional() }).parse(req.body);
  const order = await prisma.order.update({ where: { id: req.params.id }, data: input, include: { user: true, items: true, payments: true } });
  await audit(req, "ADMIN_UPDATE_ORDER", "Order", order.id, { orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus });
  res.json({ order });
}));
app.get("/admin/payments", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.FINANCE_MANAGER), asyncRoute(async (_req, res) => res.json({ payments: await prisma.payment.findMany({ include: { order: true }, orderBy: { createdAt: "desc" }, take: 100 }) })));
app.get("/admin/reports", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (_req, res) => res.json({ reports: await prisma.abuseReport.findMany({ include: { qrTag: { include: { owner: true } } }, orderBy: { createdAt: "desc" }, take: 100 }) })));
app.get("/admin/operational-reports", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (_req, res) => {
  const [abuseReports, contactRequests, resellerApplications, societies] = await Promise.all([
    prisma.abuseReport.findMany({ include: { qrTag: { include: { owner: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.contactRequest.findMany({ include: { owner: true, qrTag: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.reseller.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.society.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
  ]);
  res.json({ abuseReports, contactRequests, resellerApplications, societies });
}));
app.patch("/admin/reports/:id", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (req: AuthedRequest, res) => {
  const input = z.object({ status: z.nativeEnum(AbuseReportStatus).optional(), details: z.string().max(500).optional() }).parse(req.body);
  const report = await prisma.abuseReport.update({ where: { id: req.params.id }, data: input });
  await audit(req, "ADMIN_REVIEW_ABUSE_REPORT", "AbuseReport", report.id, { status: report.status });
  res.json({ report });
}));
app.get("/admin/audit-logs", requireAuth, requireRoles(RoleName.SUPER_ADMIN), asyncRoute(async (_req, res) => res.json({ logs: await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 100 }) })));
app.get("/admin/system-health", requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.SUPPORT_ADMIN), asyncRoute(async (_req, res) => res.json({ ok: true, db: "connected", time: new Date().toISOString() })));
app.get("/admin/backups", requireAuth, requireRoles(RoleName.SUPER_ADMIN), asyncRoute(async (_req, res) => res.json({ backups: await prisma.backupLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }) })));

app.route("/admin/products")
  .get(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.ORDER_MANAGER), asyncRoute(async (_req, res) => res.json({ products: await prisma.product.findMany({ include: { variants: true } }) })))
  .post(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.ORDER_MANAGER), asyncRoute(async (req, res) => res.status(201).json({ product: await prisma.product.create({ data: req.body }) })));
app.route("/admin/products/:id")
  .patch(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.ORDER_MANAGER), asyncRoute(async (req, res) => res.json({ product: await prisma.product.update({ where: { id: req.params.id }, data: req.body }) })))
  .delete(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.ORDER_MANAGER), asyncRoute(async (req, res) => res.json({ product: await prisma.product.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), active: false } }) })));
app.route("/admin/cms-pages")
  .get(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER), asyncRoute(async (_req, res) => res.json({ pages: await prisma.cmsPage.findMany() })))
  .post(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER), asyncRoute(async (req, res) => res.status(201).json({ page: await prisma.cmsPage.create({ data: req.body }) })));
app.route("/admin/settings")
  .get(requireAuth, requireRoles(RoleName.SUPER_ADMIN), asyncRoute(async (_req, res) => res.json({ settings: await prisma.setting.findMany() })))
  .post(requireAuth, requireRoles(RoleName.SUPER_ADMIN), asyncRoute(async (req, res) => res.status(201).json({ setting: await prisma.setting.upsert({ where: { key: req.body.key }, update: { value: req.body.value }, create: req.body }) })));
app.route("/admin/cities")
  .get(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER), asyncRoute(async (_req, res) => res.json({ cities: await prisma.city.findMany({ include: { district: true } }) })))
  .post(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER), asyncRoute(async (req, res) => res.status(201).json({ city: await prisma.city.create({ data: req.body }) })));
app.route("/admin/districts")
  .get(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER), asyncRoute(async (_req, res) => res.json({ districts: await prisma.district.findMany({ include: { cities: true } }) })))
  .post(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER), asyncRoute(async (req, res) => res.status(201).json({ district: await prisma.district.create({ data: req.body }) })));
app.route("/admin/emergency-numbers")
  .get(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER), asyncRoute(async (_req, res) => res.json({ setting: await prisma.setting.findUnique({ where: { key: "emergency_numbers" } }) })))
  .post(requireAuth, requireRoles(RoleName.SUPER_ADMIN, RoleName.CONTENT_MANAGER), asyncRoute(async (req, res) => res.json({ setting: await prisma.setting.upsert({ where: { key: "emergency_numbers" }, update: { value: req.body }, create: { key: "emergency_numbers", value: req.body } }) })));

app.get(
  "/admin/reseller-batches",
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.RESELLER_MANAGER, RoleName.SUPPORT_ADMIN),
  asyncRoute(async (_req, res) => {
    const batches = await prisma.resellerBatch.findMany({
      where: { deletedAt: null },
      include: {
        reseller: { include: { user: { select: { fullName: true, phone: true } } } },
        tags: { select: { ownerId: true, status: true, deletedAt: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ batches: batches.map(resellerBatchDto) });
  })
);

app.post(
  "/admin/reseller-batches",
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.RESELLER_MANAGER),
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = parseBody(resellerBatchCreateSchema, req);
    const reseller = await prisma.reseller.findFirst({
      where: { id: input.resellerId, deletedAt: null },
      select: { id: true, status: true }
    });
    if (!reseller) return res.status(404).json({ error: "Reseller not found" });
    if (reseller.status !== ResellerStatus.APPROVED) return res.status(409).json({ error: "Only approved resellers can receive QR batches" });

    const requestedTagIds = Array.from(new Set(input.tagIds ?? []));
    const requestedSlugs = Array.from(new Set(input.publicSlugs ?? []));
    const requestedExistingCount = requestedTagIds.length + requestedSlugs.length;
    const batchCode = input.batchCode ?? createResellerBatchCode();
    const tagType = input.tagType ?? QrTagType.OTHER;
    const labelPrefix = input.labelPrefix ?? "Reseller QR";

    const batch = await prisma.$transaction(async (tx) => {
      const existingBatch = await tx.resellerBatch.findUnique({ where: { batchCode }, select: { id: true } });
      if (existingBatch) throw Object.assign(new Error("Batch code already exists"), { statusCode: 409 });

      const createdBatch = await tx.resellerBatch.create({
        data: {
          batchCode,
          resellerId: reseller.id,
          createdById: req.user!.id,
          notes: input.notes
        }
      });

      if (requestedExistingCount) {
        const filters: Prisma.QrTagWhereInput[] = [];
        if (requestedTagIds.length) filters.push({ id: { in: requestedTagIds } });
        if (requestedSlugs.length) filters.push({ publicSlug: { in: requestedSlugs } });
        const candidateTags = await tx.qrTag.findMany({
          where: { OR: filters, deletedAt: null },
          select: { id: true, publicSlug: true, ownerId: true, status: true, resellerBatchId: true }
        });
        const unavailable = candidateTags.filter((tag) => tag.ownerId || tag.status !== QrTagStatus.PENDING_ACTIVATION || tag.resellerBatchId);
        const foundIds = new Set(candidateTags.map((tag) => tag.id));
        const foundSlugs = new Set(candidateTags.map((tag) => tag.publicSlug));
        const hasMissingTag = requestedTagIds.some((id) => !foundIds.has(id)) || requestedSlugs.some((slug) => !foundSlugs.has(slug));
        if (hasMissingTag || unavailable.length) {
          throw Object.assign(new Error("One or more QR tags are unavailable for reseller allocation"), { statusCode: 409 });
        }
        await tx.qrTag.updateMany({
          where: {
            id: { in: candidateTags.map((tag) => tag.id) },
            ownerId: null,
            status: QrTagStatus.PENDING_ACTIVATION,
            resellerBatchId: null,
            deletedAt: null
          },
          data: { resellerId: reseller.id, resellerBatchId: createdBatch.id, batchCode }
        });
      }

      if (input.quantity) {
        await tx.qrTag.createMany({
          data: Array.from({ length: input.quantity }, (_, index) => ({
            publicSlug: createPublicSlug(),
            resellerId: reseller.id,
            resellerBatchId: createdBatch.id,
            batchCode,
            type: tagType,
            label: `${labelPrefix} ${index + 1}`,
            status: QrTagStatus.PENDING_ACTIVATION,
            activationCode: randomToken(10),
            privacyMode: "PRIVATE_CONTACT_ONLY" as const
          }))
        });
      }

      return tx.resellerBatch.findUniqueOrThrow({
        where: { id: createdBatch.id },
        include: {
          reseller: { include: { user: { select: { fullName: true, phone: true } } } },
          tags: { select: { ownerId: true, status: true, deletedAt: true } }
        }
      });
    });

    await audit(req, "ADMIN_CREATE_RESELLER_BATCH", "ResellerBatch", batch.id, {
      resellerId: reseller.id,
      batchCode,
      tagCount: batch.tags.length
    });
    res.status(201).json({ batch: resellerBatchDto(batch) });
  })
);

app.post(
  "/reseller/apply",
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = z.object({ businessName: z.string().min(2), territoryCity: z.string().optional() }).parse(req.body);
    const reseller = await prisma.reseller.upsert({
      where: { userId: req.user!.id },
      update: { businessName: input.businessName, territoryCity: input.territoryCity, status: ResellerStatus.APPLIED },
      create: { userId: req.user!.id, businessName: input.businessName, territoryCity: input.territoryCity }
    });
    res.status(201).json({ reseller });
  })
);

app.get("/reseller/dashboard", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  if (!reseller) return res.status(404).json({ error: "No reseller profile" });
  const [tags, batches, customers, commissions, orders] = await Promise.all([
    prisma.qrTag.count({ where: { resellerId: reseller.id } }),
    prisma.resellerBatch.count({ where: { resellerId: reseller.id, deletedAt: null } }),
    prisma.resellerCustomer.count({ where: { resellerId: reseller.id } }),
    prisma.resellerCommission.aggregate({ where: { resellerId: reseller.id }, _sum: { amountBdt: true } }),
    prisma.order.count({ where: { resellerId: reseller.id } })
  ]);
  res.json({ reseller, metrics: { tags, batches, customers, commissionBdt: commissions._sum.amountBdt || 0, orders } });
}));
app.get("/reseller/tags", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  res.json({ tags: reseller ? await prisma.qrTag.findMany({ where: { resellerId: reseller.id }, include: { resellerBatch: true } }) : [] });
}));
app.get("/reseller/batches", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  if (!reseller) return res.json({ batches: [] });
  const batches = await prisma.resellerBatch.findMany({
    where: { resellerId: reseller.id, deletedAt: null },
    include: { tags: { select: { ownerId: true, status: true, deletedAt: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json({ batches: batches.map(resellerBatchDto) });
}));
app.post("/reseller/tags/assign", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const input = z
    .object({
      publicSlug: z.string(),
      customerPhone: z.string(),
      customerName: z.string().min(2),
      batchCode: z.string().trim().min(2).max(120).optional()
    })
    .parse(req.body);
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  if (!reseller || reseller.status !== ResellerStatus.APPROVED) return res.status(403).json({ error: "Approved reseller profile required" });
  const existingTag = await prisma.qrTag.findUnique({ where: { publicSlug: input.publicSlug }, include: { resellerBatch: true } });
  if (!existingTag || existingTag.deletedAt) return res.status(404).json({ error: "Tag not found" });
  if (existingTag.ownerId || existingTag.status !== QrTagStatus.PENDING_ACTIVATION) {
    return res.status(409).json({ error: "QR tag is not awaiting assignment" });
  }
  const batch = existingTag.resellerBatch;
  const allocatedToReseller =
    existingTag.resellerId === reseller.id &&
    (!batch || (batch.resellerId === reseller.id && batch.status === ResellerBatchStatus.ACTIVE && !batch.deletedAt));
  const batchCodeMatches = !input.batchCode || batch?.batchCode === input.batchCode || existingTag.batchCode === input.batchCode;
  if (!allocatedToReseller || !batchCodeMatches) return res.status(403).json({ error: "QR tag is not allocated to this reseller" });
  const phone = normalizeBangladeshPhone(input.customerPhone);
  const customerUser = await prisma.user.upsert({ where: { phone }, update: {}, create: { phone, fullName: input.customerName, profile: { create: {} } } });
  await ensureRole(customerUser.id, RoleName.USER);
  const assigned = await prisma.qrTag.updateMany({
    where: {
      id: existingTag.id,
      ownerId: null,
      status: QrTagStatus.PENDING_ACTIVATION,
      deletedAt: null,
      resellerId: reseller.id,
      OR: [{ resellerBatchId: null }, { resellerBatch: { is: { resellerId: reseller.id, status: ResellerBatchStatus.ACTIVE, deletedAt: null } } }]
    },
    data: { ownerId: customerUser.id, resellerId: reseller.id, status: QrTagStatus.ACTIVE, activationCode: null }
  });
  if (!assigned.count) return res.status(409).json({ error: "QR tag is no longer available for assignment" });
  if (existingTag.resellerBatchId) {
    const remaining = await prisma.qrTag.count({
      where: {
        resellerBatchId: existingTag.resellerBatchId,
        ownerId: null,
        status: QrTagStatus.PENDING_ACTIVATION,
        deletedAt: null
      }
    });
    if (!remaining) {
      await prisma.resellerBatch.update({
        where: { id: existingTag.resellerBatchId },
        data: { status: ResellerBatchStatus.CLOSED, closedAt: new Date() }
      });
    }
  }
  const tag = await prisma.qrTag.findUnique({ where: { id: existingTag.id } });
  const customer = await prisma.resellerCustomer.create({ data: { resellerId: reseller.id, userId: customerUser.id, phone, name: input.customerName } });
  res.json({ tag, customer });
}));
app.get("/reseller/customers", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  res.json({ customers: reseller ? await prisma.resellerCustomer.findMany({ where: { resellerId: reseller.id } }) : [] });
}));
app.post("/reseller/customers", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const input = z.object({ name: z.string().min(2), phone: z.string(), city: z.string().optional() }).parse(req.body);
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  if (!reseller) return res.status(404).json({ error: "No reseller profile" });
  const customer = await prisma.resellerCustomer.create({ data: { resellerId: reseller.id, name: input.name, phone: normalizeBangladeshPhone(input.phone), city: input.city } });
  res.status(201).json({ customer });
}));
app.get("/reseller/commissions", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  res.json({ commissions: reseller ? await prisma.resellerCommission.findMany({ where: { resellerId: reseller.id } }) : [] });
}));
app.get("/reseller/orders", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  res.json({ orders: reseller ? await prisma.order.findMany({ where: { resellerId: reseller.id } }) : [] });
}));
app.post("/reseller/payout-request", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const input = z.object({ amountBdt: z.number().int().min(100), payoutMethod: z.string().optional(), notes: z.string().optional() }).parse(req.body);
  const reseller = await prisma.reseller.findUnique({ where: { userId: req.user!.id } });
  if (!reseller) return res.status(404).json({ error: "No reseller profile" });
  const payout = await prisma.payout.create({ data: { resellerId: reseller.id, ...input } });
  res.status(201).json({ payout });
}));

app.post("/societies", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const input = z.object({ name: z.string().min(2), address: z.string().min(3), city: z.string().optional(), district: z.string().optional(), emergencyPhone: z.string().optional() }).parse(req.body);
  const society = await prisma.society.create({ data: input });
  await prisma.societyMember.create({ data: { societyId: society.id, userId: req.user!.id, role: SocietyMemberRole.SOCIETY_ADMIN, name: req.user!.fullName || "Society admin", phone: req.user!.phone } });
  res.status(201).json({ society });
}));
app.get("/societies", requireAuth, asyncRoute(async (req: AuthedRequest, res) => {
  const where: Prisma.SocietyWhereInput = hasGlobalSocietyAccess(req.user)
    ? { deletedAt: null }
    : { deletedAt: null, members: { some: { userId: req.user!.id } } };
  const societies = await prisma.society.findMany({ where, include: { members: true } });
  res.json({ societies });
}));
app.get("/societies/:id", requireAuth, requireSocietyRoles(), asyncRoute(async (req, res) => res.json({ society: await prisma.society.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { units: true, members: true, vehicles: true, parkingSlots: true } }) })));
app.patch("/societies/:id", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN), asyncRoute(async (req, res) => res.json({ society: await prisma.society.update({ where: { id: req.params.id }, data: req.body }) })));
app.post("/societies/:id/units", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN), asyncRoute(async (req, res) => {
  const input = z.object({ unitNo: z.string().min(1), building: z.string().optional(), floor: z.string().optional() }).parse(req.body);
  res.status(201).json({ unit: await prisma.societyUnit.create({ data: { societyId: req.params.id, ...input } }) });
}));
app.get("/societies/:id/units", requireAuth, requireSocietyRoles(), asyncRoute(async (req, res) => res.json({ units: await prisma.societyUnit.findMany({ where: { societyId: req.params.id } }) })));
app.post("/societies/:id/members", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN), asyncRoute(async (req, res) => {
  const input = z.object({ name: z.string().min(2), phone: z.string(), role: z.nativeEnum(SocietyMemberRole), unitId: z.string().optional() }).parse(req.body);
  if (input.unitId) {
    const unit = await prisma.societyUnit.findFirst({ where: { id: input.unitId, societyId: req.params.id }, select: { id: true } });
    if (!unit) return res.status(400).json({ error: "Unit does not belong to this society" });
  }
  res.status(201).json({ member: await prisma.societyMember.create({ data: { societyId: req.params.id, ...input, phone: normalizeBangladeshPhone(input.phone) } }) });
}));
app.get("/societies/:id/members", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN, SocietyMemberRole.GUARD), asyncRoute(async (req, res) => res.json({ members: await prisma.societyMember.findMany({ where: { societyId: req.params.id } }) })));
app.post("/societies/:id/vehicles", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN), asyncRoute(async (req, res) => {
  const input = z.object({ vehicleNumber: z.string().min(2), vehicleType: z.string().default("car"), memberId: z.string().optional(), unitId: z.string().optional(), qrTagId: z.string().optional() }).parse(req.body);
  if (input.memberId) {
    const member = await prisma.societyMember.findFirst({ where: { id: input.memberId, societyId: req.params.id }, select: { id: true } });
    if (!member) return res.status(400).json({ error: "Member does not belong to this society" });
  }
  if (input.unitId) {
    const unit = await prisma.societyUnit.findFirst({ where: { id: input.unitId, societyId: req.params.id }, select: { id: true } });
    if (!unit) return res.status(400).json({ error: "Unit does not belong to this society" });
  }
  if (input.qrTagId) {
    const tag = await prisma.qrTag.findFirst({ where: { id: input.qrTagId, societyId: req.params.id, deletedAt: null }, select: { id: true } });
    if (!tag) return res.status(400).json({ error: "QR tag does not belong to this society" });
  }
  res.status(201).json({ vehicle: await prisma.societyVehicle.create({ data: { societyId: req.params.id, ...input } }) });
}));
app.get("/societies/:id/vehicles", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN, SocietyMemberRole.GUARD), asyncRoute(async (req, res) => res.json({ vehicles: await prisma.societyVehicle.findMany({ where: { societyId: req.params.id } }) })));
app.post("/societies/:id/parking-slots", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN), asyncRoute(async (req, res) => {
  const input = z.object({ label: z.string().min(1), status: z.string().default("available"), qrTagId: z.string().optional() }).parse(req.body);
  if (input.qrTagId) {
    const tag = await prisma.qrTag.findFirst({ where: { id: input.qrTagId, societyId: req.params.id, deletedAt: null }, select: { id: true } });
    if (!tag) return res.status(400).json({ error: "QR tag does not belong to this society" });
  }
  res.status(201).json({ slot: await prisma.parkingSlot.create({ data: { societyId: req.params.id, ...input } }) });
}));
app.get("/societies/:id/parking-slots", requireAuth, requireSocietyRoles(), asyncRoute(async (req, res) => res.json({ slots: await prisma.parkingSlot.findMany({ where: { societyId: req.params.id } }) })));
app.post("/societies/:id/visitor-logs", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN, SocietyMemberRole.GUARD), asyncRoute(async (req: AuthedRequest, res) => {
  const input = z.object({ visitorName: z.string().min(2), visitorPhone: z.string().optional(), vehicleNumber: z.string().optional(), purpose: z.string().optional(), unitId: z.string().optional() }).parse(req.body);
  if (input.unitId) {
    const unit = await prisma.societyUnit.findFirst({ where: { id: input.unitId, societyId: req.params.id }, select: { id: true } });
    if (!unit) return res.status(400).json({ error: "Unit does not belong to this society" });
  }
  res.status(201).json({ log: await prisma.visitorLog.create({ data: { societyId: req.params.id, ...input, enteredByUserId: req.user!.id } }) });
}));
app.patch("/societies/:id/visitor-logs/:logId/exit", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN, SocietyMemberRole.GUARD), asyncRoute(async (req: AuthedRequest, res) => {
  const log = await prisma.visitorLog.findFirst({ where: { id: req.params.logId, societyId: req.params.id, deletedAt: null }, select: { id: true } });
  if (!log) return res.status(404).json({ error: "Visitor log not found" });
  res.json({ log: await prisma.visitorLog.update({ where: { id: log.id }, data: { status: VisitorStatus.EXITED, exitAt: new Date(), exitedByUserId: req.user!.id } }) });
}));
app.get("/societies/:id/visitor-logs", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN, SocietyMemberRole.GUARD), asyncRoute(async (req, res) => res.json({ logs: await prisma.visitorLog.findMany({ where: { societyId: req.params.id }, orderBy: { entryAt: "desc" }, take: 100 }) })));
app.get("/societies/:id/reports", requireAuth, requireSocietyRoles(SocietyMemberRole.SOCIETY_ADMIN, SocietyMemberRole.GUARD), asyncRoute(async (req, res) => {
  const [activeVisitors, vehicles, residents] = await Promise.all([
    prisma.visitorLog.count({ where: { societyId: req.params.id, status: VisitorStatus.ENTERED } }),
    prisma.societyVehicle.count({ where: { societyId: req.params.id } }),
    prisma.societyMember.count({ where: { societyId: req.params.id, role: SocietyMemberRole.RESIDENT } })
  ]);
  res.json({ metrics: { activeVisitors, vehicles, residents } });
}));

app.get("/cms/pages", asyncRoute(async (_req, res) => res.json({ pages: await prisma.cmsPage.findMany({ where: { status: "PUBLISHED" } }) })));
app.get("/cms/pages/:slug", asyncRoute(async (req, res) => {
  const locale = req.query.locale === "BN" ? Language.BN : Language.EN;
  const page = await prisma.cmsPage.findUnique({ where: { slug_locale: { slug: req.params.slug, locale } } });
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json({ page });
}));

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    debugLog("api.error.validation", { method: req.method, path: safeRequestPath(req), fields: Object.keys(error.flatten().fieldErrors).join(",") });
    return res.status(400).json({ error: "Validation failed", details: error.flatten() });
  }
  const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode: number }).statusCode) : 500;
  const message = error instanceof Error ? error.message : "Internal server error";
  debugLog("api.error", { method: req.method, path: safeRequestPath(req), statusCode, message });
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ error: message });
});

export { app, isPublicTagActive, safePublicTagDto };

if (process.env.NODE_ENV !== "test") {
  app.listen(env.port, () => {
    console.info(`ScanContact BD API listening on http://localhost:${env.port}`);
  });
}
