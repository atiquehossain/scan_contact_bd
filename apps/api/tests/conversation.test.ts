import { ContactRequestStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  CONVERSATION_ACTIVE_MS,
  CONVERSATION_RETENTION_MS,
  expiredConversationPatch,
  hashConversationToken,
  isConversationExpired,
  isConversationReplyAllowed,
  nextConversationDeleteAt,
  nextConversationExpiry
} from "../src/lib/conversation.js";

describe("conversation lifecycle", () => {
  it("hashes scanner reply tokens instead of storing raw values", () => {
    const token = "scanner-private-token";
    expect(hashConversationToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashConversationToken(token)).not.toBe(token);
    expect(hashConversationToken(token)).toBe(hashConversationToken(token));
  });

  it("creates a 30 minute active window", () => {
    const now = new Date("2026-04-27T00:00:00.000Z");
    expect(nextConversationExpiry(now).getTime() - now.getTime()).toBe(
      CONVERSATION_ACTIVE_MS
    );
  });

  it("keeps expired conversations for 10 days", () => {
    const expiredAt = new Date("2026-04-27T00:30:00.000Z");
    expect(nextConversationDeleteAt(expiredAt).getTime() - expiredAt.getTime()).toBe(
      CONVERSATION_RETENTION_MS
    );
  });

  it("marks open conversations expired after expiresAt", () => {
    const now = new Date("2026-04-27T01:00:00.000Z");
    const conversation = {
      status: ContactRequestStatus.OPEN,
      expiresAt: new Date("2026-04-27T00:59:59.000Z"),
      expiredAt: null,
      deleteAt: null
    };
    expect(isConversationExpired(conversation, now)).toBe(true);
    const patch = expiredConversationPatch(conversation, now);
    expect(patch.status).toBe(ContactRequestStatus.EXPIRED);
    expect(patch.expiredAt).toEqual(conversation.expiresAt);
    expect(patch.deleteAt.getTime() - patch.expiredAt.getTime()).toBe(
      CONVERSATION_RETENTION_MS
    );
  });

  it("allows replies only while open and inside the active window", () => {
    const now = new Date("2026-04-27T01:00:00.000Z");
    expect(
      isConversationReplyAllowed(
        {
          status: ContactRequestStatus.OPEN,
          expiresAt: new Date("2026-04-27T01:00:00.000Z")
        },
        now
      )
    ).toBe(true);
    expect(
      isConversationReplyAllowed(
        {
          status: ContactRequestStatus.EXPIRED,
          expiresAt: new Date("2026-04-27T02:00:00.000Z")
        },
        now
      )
    ).toBe(false);
  });
});
