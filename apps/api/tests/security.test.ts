import { describe, expect, it } from "vitest";
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
