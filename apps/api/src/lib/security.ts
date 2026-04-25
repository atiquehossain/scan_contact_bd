import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function hmac(value: string, secret = env.otpSecret): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function randomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function createPublicSlug(): string {
  return crypto.randomBytes(16).toString("base64url");
}

export function hashNetworkValue(value?: string): string | undefined {
  if (!value) return undefined;
  return hmac(value, env.otpSecret);
}

export function signAccessToken(userId: string, roles: string[] = []): string {
  return jwt.sign({ roles }, env.jwtSecret, {
    subject: userId,
    issuer: "scancontact-bd",
    audience: "scancontact-users",
    expiresIn: "15m"
  });
}

export function verifyAccessToken(token: string): { sub: string; roles?: string[] } {
  const decoded = jwt.verify(token, env.jwtSecret, {
    issuer: "scancontact-bd",
    audience: "scancontact-users"
  });
  if (!decoded || typeof decoded !== "object" || !decoded.sub) {
    throw new Error("Invalid token");
  }
  return decoded as { sub: string; roles?: string[] };
}

export function hashRefreshToken(token: string): string {
  return hmac(token, env.jwtRefreshSecret);
}
