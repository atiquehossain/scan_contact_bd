import { createHash } from "node:crypto";
import { ContactRequestStatus } from "@prisma/client";

export const CONVERSATION_ACTIVE_MS = 30 * 60 * 1000;
export const CONVERSATION_RETENTION_MS = 10 * 24 * 60 * 60 * 1000;

export type ConversationLifecycleInput = {
  status: ContactRequestStatus;
  expiresAt: Date | null;
  expiredAt?: Date | null;
  closedAt?: Date | null;
  deleteAt?: Date | null;
};

export function hashConversationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function nextConversationExpiry(now = new Date()) {
  return new Date(now.getTime() + CONVERSATION_ACTIVE_MS);
}

export function nextConversationDeleteAt(activityEnd: Date) {
  return new Date(activityEnd.getTime() + CONVERSATION_RETENTION_MS);
}

export function isConversationExpired(
  conversation: ConversationLifecycleInput,
  now = new Date()
) {
  return (
    conversation.status === ContactRequestStatus.OPEN &&
    conversation.expiresAt !== null &&
    conversation.expiresAt.getTime() < now.getTime()
  );
}

export function expiredConversationPatch(
  conversation: ConversationLifecycleInput,
  now = new Date()
) {
  const expiredAt = conversation.expiredAt ?? conversation.expiresAt ?? now;
  return {
    status: ContactRequestStatus.EXPIRED,
    expiredAt,
    deleteAt: conversation.deleteAt ?? nextConversationDeleteAt(expiredAt)
  };
}

export function isConversationReplyAllowed(
  conversation: ConversationLifecycleInput,
  now = new Date()
) {
  return (
    conversation.status === ContactRequestStatus.OPEN &&
    conversation.expiresAt !== null &&
    conversation.expiresAt.getTime() >= now.getTime()
  );
}

export const conversationExpiredResponse = {
  code: "CONVERSATION_EXPIRED",
  message: "This conversation expired. Please scan the QR again to send a new message."
};

export const conversationUnavailableResponse = {
  code: "CONVERSATION_NOT_AVAILABLE",
  message: "This conversation is no longer available. Please scan the QR again to send a new message."
};
