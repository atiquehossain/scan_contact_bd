import dotenv from "dotenv";

dotenv.config();

const requiredFallback = "development-secret-change-me";

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
  fcmProjectId: process.env.FCM_PROJECT_ID || "",
  fcmClientEmail: process.env.FCM_CLIENT_EMAIL || "",
  fcmPrivateKey: (process.env.FCM_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPhone: process.env.ADMIN_PHONE || "+8801000000000",
  adminPassword: process.env.ADMIN_PASSWORD || "change-me-admin-password"
};

export const isProduction = env.nodeEnv === "production";
