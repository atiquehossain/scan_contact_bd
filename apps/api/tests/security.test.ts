import { describe, expect, it } from "vitest";
import { isLocalDevelopmentEnv, validateProductionEnv } from "../src/lib/env.js";
import { createPublicSlug, generateOtp, hmac } from "../src/lib/security.js";

describe("security helpers", () => {
  it("generates 6 digit OTP values", () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it("hashes secrets instead of storing raw values", () => {
    const raw = "01700000003:123456";
    expect(hmac(raw)).not.toBe(raw);
    expect(hmac(raw)).toBe(hmac(raw));
  });

  it("generates unguessable public slugs", () => {
    const slug = createPublicSlug();
    expect(slug.length).toBeGreaterThanOrEqual(20);
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("production environment validation", () => {
  const strongProductionEnv = {
    NODE_ENV: "production",
    JWT_SECRET: "j".repeat(32),
    JWT_REFRESH_SECRET: "r".repeat(32),
    OTP_SECRET: "o".repeat(32),
    ADMIN_PASSWORD: "a".repeat(16)
  };

  it("rejects missing, default, short, or reused production secrets", () => {
    expect(() => validateProductionEnv({ NODE_ENV: "production" })).toThrow(/JWT_SECRET is required/);
    expect(() =>
      validateProductionEnv({
        ...strongProductionEnv,
        JWT_SECRET: "development-secret-change-me"
      })
    ).toThrow(/default development value/);
    expect(() =>
      validateProductionEnv({
        ...strongProductionEnv,
        OTP_SECRET: "short"
      })
    ).toThrow(/OTP_SECRET must be at least 32 characters/);
    expect(() =>
      validateProductionEnv({
        ...strongProductionEnv,
        JWT_REFRESH_SECRET: strongProductionEnv.JWT_SECRET
      })
    ).toThrow(/JWT_SECRET and JWT_REFRESH_SECRET must be different/);
  });

  it("allows dev OTP exposure only for explicit local development", () => {
    expect(isLocalDevelopmentEnv({ nodeEnv: "development", appUrl: "http://localhost:3000", apiUrl: "http://localhost:4000" })).toBe(true);
    expect(isLocalDevelopmentEnv({ nodeEnv: "test", appUrl: "http://localhost:3000", apiUrl: "http://localhost:4000" })).toBe(false);
    expect(isLocalDevelopmentEnv({ nodeEnv: "development", appUrl: "https://nonumqr.example", apiUrl: "https://api.nonumqr.example" })).toBe(false);
  });
});
