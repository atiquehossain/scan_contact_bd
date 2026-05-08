import dotenv from "dotenv";

dotenv.config();

const requiredFallback = "development-secret-change-me";
const defaultSecretValues = new Set([
  requiredFallback,
  "change-me",
  "change-me-admin-password",
  "changeme",
  "password",
  "secret"
]);

type SecretRequirement = {
  name: string;
  value: string | undefined;
  minLength: number;
};

function isDefaultSecret(value: string) {
  return defaultSecretValues.has(value.trim().toLowerCase());
}

export function validateProductionEnv(source: NodeJS.ProcessEnv = process.env) {
  if ((source.NODE_ENV || "development") !== "production") return;

  const requirements: SecretRequirement[] = [
    { name: "JWT_SECRET", value: source.JWT_SECRET, minLength: 32 },
    { name: "JWT_REFRESH_SECRET", value: source.JWT_REFRESH_SECRET, minLength: 32 },
    { name: "OTP_SECRET", value: source.OTP_SECRET, minLength: 32 },
    { name: "ADMIN_PASSWORD", value: source.ADMIN_PASSWORD, minLength: 16 }
  ];
  const errors: string[] = [];

  for (const requirement of requirements) {
    const value = requirement.value?.trim();
    if (!value) {
      errors.push(`${requirement.name} is required`);
      continue;
    }
    if (isDefaultSecret(value)) {
      errors.push(`${requirement.name} must not use a default development value`);
    }
    if (value.length < requirement.minLength) {
      errors.push(`${requirement.name} must be at least ${requirement.minLength} characters`);
    }
  }

  const jwtSecret = source.JWT_SECRET?.trim();
  const jwtRefreshSecret = source.JWT_REFRESH_SECRET?.trim();
  const otpSecret = source.OTP_SECRET?.trim();
  if (jwtSecret && jwtRefreshSecret && jwtSecret === jwtRefreshSecret) {
    errors.push("JWT_SECRET and JWT_REFRESH_SECRET must be different");
  }
  if (jwtSecret && otpSecret && jwtSecret === otpSecret) {
    errors.push("JWT_SECRET and OTP_SECRET must be different");
  }
  if (jwtRefreshSecret && otpSecret && jwtRefreshSecret === otpSecret) {
    errors.push("JWT_REFRESH_SECRET and OTP_SECRET must be different");
  }

  if (errors.length) {
    throw new Error(`Invalid production configuration: ${errors.join("; ")}`);
  }
}

function isLocalUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function isLocalDevelopmentEnv(config: { nodeEnv: string; appUrl: string; apiUrl: string }) {
  return config.nodeEnv === "development" && (isLocalUrl(config.appUrl) || isLocalUrl(config.apiUrl));
}

validateProductionEnv();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwtSecret: process.env.JWT_SECRET || requiredFallback,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || requiredFallback,
  otpSecret: process.env.OTP_SECRET || requiredFallback,
  appUrl: process.env.APP_URL || "http://localhost:3000",
  apiUrl: process.env.API_URL || "http://localhost:4000",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  otpProvider: process.env.OTP_PROVIDER || "dev-log",
  webrtcStunUrls: process.env.WEBRTC_STUN_URLS || "stun:stun.l.google.com:19302",
  webrtcTurnUrls: process.env.WEBRTC_TURN_URLS || "",
  webrtcTurnUsername: process.env.WEBRTC_TURN_USERNAME || "",
  webrtcTurnCredential: process.env.WEBRTC_TURN_CREDENTIAL || "",
  webrtcTurnSharedSecret: process.env.WEBRTC_TURN_SHARED_SECRET || "",
  webrtcTurnTtlSeconds: Number(process.env.WEBRTC_TURN_TTL_SECONDS || 3600),
  fcmProjectId: process.env.FCM_PROJECT_ID || "",
  fcmClientEmail: process.env.FCM_CLIENT_EMAIL || "",
  fcmPrivateKey: (process.env.FCM_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPhone: process.env.ADMIN_PHONE || "+8801000000000",
  adminPassword: process.env.ADMIN_PASSWORD || "change-me-admin-password"
};

export const isProduction = env.nodeEnv === "production";
export const isLocalDevelopment = isLocalDevelopmentEnv(env);
