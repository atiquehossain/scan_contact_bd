import { z } from "zod";

export const DEFAULT_APP_NAME = "ScanContact BD";

export const supportedLanguages = ["en", "bn"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const qrTagTypes = [
  "CAR",
  "MOTORBIKE",
  "DELIVERY_BIKE",
  "LOST_ITEM",
  "BUSINESS_CARD",
  "APARTMENT_PARKING",
  "SHOP",
  "OTHER"
] as const;

export const contactReasons = [
  "VEHICLE_BLOCKING",
  "LIGHT_ON",
  "VEHICLE_DAMAGED",
  "FOUND_ITEM",
  "DELIVERY_CONTACT",
  "BUSINESS_INQUIRY",
  "OTHER"
] as const;

export type QrTagType = (typeof qrTagTypes)[number];
export type ContactReason = (typeof contactReasons)[number];

export const bangladeshPhoneRegex = /^(?:\+?8801|01)[3-9]\d{8}$/;

export function normalizeBangladeshPhone(input: string): string {
  const compact = input.replace(/[\s().-]/g, "");
  if (/^01[3-9]\d{8}$/.test(compact)) {
    return `+88${compact}`;
  }
  if (/^8801[3-9]\d{8}$/.test(compact)) {
    return `+${compact}`;
  }
  if (/^\+8801[3-9]\d{8}$/.test(compact)) {
    return compact;
  }
  throw new Error("Invalid Bangladesh mobile number");
}

export function isBangladeshPhone(input: string): boolean {
  try {
    normalizeBangladeshPhone(input);
    return true;
  } catch {
    return false;
  }
}

export function formatBdt(amount: number, language: SupportedLanguage = "en"): string {
  return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0
  }).format(amount);
}

export const publicContactRequestSchema = z.object({
  reason: z.enum(contactReasons),
  message: z.string().trim().min(3).max(500),
  scannerName: z.string().trim().max(80).optional(),
  scannerContact: z.string().trim().max(80).optional()
});

export const createTagSchema = z.object({
  type: z.enum(qrTagTypes),
  label: z.string().trim().min(2).max(80),
  vehicleNumber: z.string().trim().max(30).optional(),
  itemName: z.string().trim().max(80).optional(),
  privacyMode: z
    .enum([
      "PRIVATE_CONTACT_ONLY",
      "SHOW_NAME_ONLY",
      "SHOW_BUSINESS_INFO",
      "PHONE_VISIBLE_BY_OWNER_CHOICE"
    ])
    .default("PRIVATE_CONTACT_ONLY"),
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
