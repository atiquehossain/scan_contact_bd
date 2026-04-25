import { describe, expect, it } from "vitest";
import { isBangladeshPhone, normalizeBangladeshPhone } from "../src/lib/phone.js";

describe("Bangladesh phone validation", () => {
  it("normalizes local mobile numbers", () => {
    expect(normalizeBangladeshPhone("01700000003")).toBe("+8801700000003");
  });

  it("normalizes 880-prefixed mobile numbers", () => {
    expect(normalizeBangladeshPhone("8801700000003")).toBe("+8801700000003");
  });

  it("rejects invalid local mobile numbers", () => {
    expect(isBangladeshPhone("01200000000")).toBe(false);
    expect(() => normalizeBangladeshPhone("1234")).toThrow();
  });
});
