export const BRAND_PROMISE = "Scan QR. Contact privately. Phone numbers stay hidden.";
export const PRIVATE_QR_CONTACT = "Private QR Contact";

const internalLabelPattern = /\b(debug|test|demo|dummy|sample|flow)\b/i;

export function safePublicLabel(label?: string | null, fallback = "QR contact tag") {
  const value = label?.trim();
  if (!value) return fallback;
  if (internalLabelPattern.test(value)) return fallback;
  return value;
}

export function contactContextTitle(type?: string | null, label?: string | null) {
  const normalizedType = String(type || "").toUpperCase();
  if (["CAR", "MOTORBIKE", "DELIVERY_BIKE", "APARTMENT_PARKING"].includes(normalizedType)) {
    return "Vehicle Owner Contact";
  }
  if (normalizedType === "LOST_ITEM") return "Lost Item Owner Contact";
  if (["BUSINESS_CARD", "SHOP"].includes(normalizedType)) return "Business Owner Contact";

  const normalizedLabel = label?.toLowerCase() || "";
  if (/(car|vehicle|bike|motor|parking)/.test(normalizedLabel)) return "Vehicle Owner Contact";
  if (/(shop|business|card)/.test(normalizedLabel)) return "Business Owner Contact";
  if (/(lost|item|bag|key|wallet|document)/.test(normalizedLabel)) return "Lost Item Owner Contact";
  return "QR Owner Contact";
}
