"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  Building2,
  Car,
  Check,
  CheckCircle2,
  ExternalLink,
  Info,
  Lightbulb,
  LockKeyhole,
  MoreHorizontal,
  PackageSearch,
  PhoneCall,
  QrCode,
  Send,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { API_BASE, apiFetch } from "@/lib/api";
import { BRAND_NAME, PRIVATE_QR_CONTACT, contactContextTitle, safePublicLabel } from "@/lib/brand";
import { PublicConversation } from "@/components/PublicConversation";
import { Button, FieldError, InlineAlert, LoadingState } from "@/components/admin/ui";

const reasons: Array<{ value: string; label: string; Icon: LucideIcon }> = [
  { value: "VEHICLE_BLOCKING", label: "Vehicle blocking", Icon: Car },
  { value: "LIGHT_ON", label: "Light on", Icon: Lightbulb },
  { value: "VEHICLE_DAMAGED", label: "Vehicle damaged", Icon: Wrench },
  { value: "FOUND_ITEM", label: "Found item", Icon: PackageSearch },
  { value: "DELIVERY_CONTACT", label: "Delivery contact", Icon: Truck },
  { value: "BUSINESS_INQUIRY", label: "Business inquiry", Icon: Building2 },
  { value: "OTHER", label: "Other", Icon: MoreHorizontal }
];

type SavedConversation = {
  id: string;
  token: string;
  url: string;
  expiresAt?: string | null;
};

function purposeCopy(type?: string) {
  switch (type) {
    case "CAR":
    case "MOTORBIKE":
    case "DELIVERY_BIKE":
    case "APARTMENT_PARKING":
      return "Vehicle blocking / parking contact";
    case "LOST_ITEM":
      return "Lost item private contact";
    case "BUSINESS_CARD":
      return "Business inquiry private contact";
    case "SHOP":
      return "Shop contact request";
    default:
      return "Send a private request to the owner without revealing phone numbers.";
  }
}

function tagTypeLabel(type?: string | null) {
  switch (String(type || "").toUpperCase()) {
    case "CAR":
      return "Car sticker";
    case "MOTORBIKE":
      return "Bike sticker";
    case "DELIVERY_BIKE":
      return "Delivery rider QR";
    case "APARTMENT_PARKING":
      return "Apartment parking QR";
    case "LOST_ITEM":
      return "Lost item tag";
    case "BUSINESS_CARD":
      return "Business QR card";
    case "SHOP":
      return "Shop QR sticker";
    default:
      return "NoNumQR tag";
  }
}

function statusLabel(status?: string | null, isActive?: boolean) {
  if (isActive) return "Active";
  const normalized = String(status || "").replace(/_/g, " ").trim();
  return normalized ? normalized.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Unavailable";
}

function unavailableTitle(tag: any) {
  if (!tag) return "This QR tag is not available right now.";
  const normalized = String(tag.status || "").toUpperCase();
  if (normalized === "DELETED") return "This QR tag is no longer available.";
  if (normalized === "DISABLED") return "This QR tag is paused right now.";
  if (normalized === "EXPIRED") return "This QR tag has expired.";
  return "This QR tag is not available right now.";
}

function publicSlugFromLocation(fallback?: string) {
  if (typeof window === "undefined") return fallback || "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const value = parts[0] === "t" ? parts[1] : fallback || "";
  return value && !value.startsWith("__") ? decodeURIComponent(value) : fallback || "";
}

export function ScanClient({ slug: initialSlug }: { slug?: string }) {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [slug, setSlug] = useState(() => publicSlugFromLocation(initialSlug));
  const [tag, setTag] = useState<any>(null);
  const [loadingTag, setLoadingTag] = useState(true);
  const [reason, setReason] = useState("VEHICLE_BLOCKING");
  const [message, setMessage] = useState("");
  const [scannerName, setScannerName] = useState("");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<{ message?: string; reason?: string; report?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [conversation, setConversation] = useState<SavedConversation | null>(null);
  const [validatingSavedConversation, setValidatingSavedConversation] = useState(false);
  const [safetyHost, setSafetyHost] = useState("nonumqr.com");

  useEffect(() => {
    setSafetyHost(window.location.hostname || "nonumqr.com");
  }, []);

  useEffect(() => {
    const nextSlug = publicSlugFromLocation(initialSlug);
    setSlug(nextSlug);
  }, [initialSlug]);

  useEffect(() => {
    if (!slug) {
      setStatus("QR link is missing or invalid.");
      setLoadingTag(false);
      return;
    }
    setLoadingTag(true);
    apiFetch<{ tag: any }>(`/t/${slug}`, {}, "")
      .then((data) => setTag(data.tag))
      .catch((error) => setStatus(error instanceof Error ? error.message : "QR tag could not be loaded."))
      .finally(() => setLoadingTag(false));
    fetch(`${API_BASE}/t/${slug}/scan`, { method: "POST" }).catch(() => undefined);
    validateSavedConversation(slug);
  }, [slug]);

  async function validateSavedConversation(publicSlug: string) {
    const storageKey = `nonumqr:conversation:${publicSlug}`;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    let parsed: SavedConversation;
    try {
      parsed = JSON.parse(saved) as SavedConversation;
    } catch {
      window.localStorage.removeItem(storageKey);
      return;
    }
    if (!parsed.id || !parsed.token) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    setValidatingSavedConversation(true);
    try {
      const data = await apiFetch<{ conversationId: string; expiresAt?: string | null; status: string }>(
        `/public/contact-requests/${encodeURIComponent(parsed.id)}/validate?token=${encodeURIComponent(parsed.token)}`,
        {},
        ""
      );
      if (data.status === "OPEN") {
        const nextConversation = { ...parsed, expiresAt: data.expiresAt ?? parsed.expiresAt };
        setConversation(nextConversation);
        window.localStorage.setItem(storageKey, JSON.stringify(nextConversation));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setValidatingSavedConversation(false);
    }
  }

  function startNewMessage() {
    if (slug) window.localStorage.removeItem(`nonumqr:conversation:${slug}`);
    setConversation(null);
    setStatus("");
  }

  function validate() {
    const nextErrors: typeof errors = {};
    if (!reason) nextErrors.reason = "Choose a reason.";
    if (message.trim().length < 3) nextErrors.message = "Write a short message before sending.";
    return nextErrors;
  }

  async function submitContact() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStatus("Please fix the highlighted fields.");
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }
    setSubmitting(true);
    setStatus("");
    setErrors({});
    try {
      const data = await apiFetch<{ contactRequestId: string; conversationToken: string; conversationUrl: string; expiresAt?: string | null }>(
        `/t/${slug}/contact`,
        {
          method: "POST",
          body: JSON.stringify({ reason, message: message.trim(), scannerName: scannerName.trim() || undefined })
        },
        ""
      );
      const nextConversation = { id: data.contactRequestId, token: data.conversationToken, url: data.conversationUrl, expiresAt: data.expiresAt };
      setConversation(nextConversation);
      window.localStorage.setItem(`nonumqr:conversation:${slug}`, JSON.stringify(nextConversation));
      setStatus("Message sent privately. The owner can reply from their owner app.");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed. Please try again.");
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
    } finally {
      setSubmitting(false);
    }
  }

  async function reportAbuse() {
    if (reportReason.trim().length < 3) {
      setErrors({ report: "Write a short abuse reason." });
      return;
    }
    setReporting(true);
    setErrors({});
    try {
      await apiFetch(
        `/t/${slug}/report-abuse`,
        {
          method: "POST",
          body: JSON.stringify({ reason: reportReason.trim(), details: reportDetails.trim() || undefined })
        },
        ""
      );
      setStatus("Report submitted. Thank you for helping keep NoNumQR safe.");
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Report failed. Please try again.");
    } finally {
      setReporting(false);
    }
  }

  async function startPrivateCall() {
    setStartingCall(true);
    setStatus("");
    let permissionStream: MediaStream | null = null;
    try {
      if (!window.isSecureContext) {
        throw new Error("Private audio calls need a secure HTTPS link. Text messages still work on this local link.");
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support private voice calls. Please send a text message instead.");
      }
      permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      permissionStream.getTracks().forEach((track) => track.stop());
      const data = await apiFetch<{ callUrl: string }>(
        `/t/${slug}/call`,
        {
          method: "POST",
          body: JSON.stringify({ scannerName: scannerName.trim() || undefined })
        },
        ""
      );
      router.push(data.callUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start private call. Please try text instead.");
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
    } finally {
      permissionStream?.getTracks().forEach((track) => track.stop());
      setStartingCall(false);
    }
  }

  const normalizedStatus = String(tag?.status || "").toUpperCase();
  const isActiveTag = Boolean(tag?.isActive && normalizedStatus === "ACTIVE");
  const contactFormAvailable = isActiveTag && tag?.contactOptions?.contactForm !== false;
  const canStartPrivateCall = isActiveTag;
  const messageWasSent = Boolean(conversation && status.toLowerCase().includes("sent"));
  const statusTone = status.includes("sent") || status.includes("submitted") ? "success" : "warning";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(250,248,255,0.9),rgba(248,250,252,0.98))] px-4 py-4 text-[var(--color-ink)] sm:py-8">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-4">
        <header className="flex min-h-14 items-center justify-between rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white/90 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <QrCode aria-hidden size={21} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--color-primary)]">{BRAND_NAME}</p>
              <p className="text-xs font-medium text-[var(--color-muted)]">{PRIVATE_QR_CONTACT}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[var(--color-success-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-success-text)]">
            <ShieldCheck aria-hidden size={14} />
            Privacy first
          </span>
        </header>

        <section className="rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
          {loadingTag ? (
            <LoadingState label="Loading QR page..." />
          ) : (
            <div className="qr-shimmer relative overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white">
                    <QrCode aria-hidden size={26} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">{tagTypeLabel(tag?.type)}</p>
                    <h1 className="mt-1 text-xl font-bold leading-7 tracking-[-0.01em] text-[var(--color-ink-strong)]">
                      {contactContextTitle(tag?.type, tag?.label)}
                    </h1>
                    <p className="mt-1 text-sm leading-5 text-[var(--color-muted)]">{purposeCopy(tag?.type)}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    isActiveTag
                      ? "border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
                      : "border-amber-200 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isActiveTag ? "bg-[var(--color-secondary)]" : "bg-[var(--color-warning)]"}`} aria-hidden />
                  {statusLabel(tag?.status, isActiveTag)}
                </span>
              </div>

              <dl className="relative z-10 mt-4 grid gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">Tag type</dt>
                  <dd className="mt-1 font-semibold text-[var(--color-ink)]">{tagTypeLabel(tag?.type)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">Tag label</dt>
                  <dd className="mt-1 font-semibold text-[var(--color-ink)]">{safePublicLabel(tag?.label)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">Status</dt>
                  <dd className="mt-1 font-semibold text-[var(--color-ink)]">{statusLabel(tag?.status, isActiveTag)}</dd>
                </div>
              </dl>
            </div>
          )}

          <section className="mt-4 rounded-[var(--radius-card)] border border-teal-200 bg-[var(--color-primary-soft)] p-4 text-sm leading-6 text-[var(--color-primary-hover)]">
            <div className="flex items-start gap-3">
              <LockKeyhole aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-bold text-[var(--color-ink-strong)]">The owner&apos;s phone number is hidden.</h2>
                <p className="mt-1">This QR contains only a public URL. It does not contain the owner&apos;s phone number.</p>
                <p className="mt-1">Your message will be sent privately to the owner.</p>
              </div>
            </div>
          </section>

          {status ? (
            <div ref={errorSummaryRef} tabIndex={-1} className="mt-4">
              <InlineAlert tone={statusTone}>{status}</InlineAlert>
            </div>
          ) : null}

          {validatingSavedConversation ? (
            <div className="mt-4">
              <LoadingState label="Checking for an active conversation..." />
            </div>
          ) : null}

          {!loadingTag && !isActiveTag ? (
            <section className="mt-4 rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white p-5 text-center shadow-[var(--shadow-card)]">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-muted)]">
                <Ban aria-hidden size={30} />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-[-0.01em] text-[var(--color-ink-strong)]">{unavailableTitle(tag)}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
                This page cannot be used to contact the owner. Owner phone number is still not shown.
              </p>
            </section>
          ) : null}

          {conversation ? (
            <section className="mt-4 rounded-[var(--radius-card-lg)] border border-emerald-200 bg-[var(--color-success-bg)] p-5 text-center shadow-[var(--shadow-card)]">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[var(--color-success-text)] shadow-[var(--shadow-card)]">
                <CheckCircle2 aria-hidden size={32} />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-[-0.01em] text-[var(--color-ink-strong)]">
                {messageWasSent ? "Your private message was sent." : "Continue your private conversation."}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
                Use this link to continue the private conversation. The owner&apos;s phone number stays hidden.
              </p>
              {conversation.expiresAt ? (
                <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">Active until {new Date(conversation.expiresAt).toLocaleString()}</p>
              ) : null}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]" href={conversation.url}>
                  <ExternalLink aria-hidden size={16} />
                  Continue Conversation
                </a>
                <button
                  type="button"
                  className="focus-ring inline-flex min-h-12 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary)] transition hover:bg-[#f8fbf9]"
                  onClick={startNewMessage}
                >
                  Start new message
                </button>
              </div>
            </section>
          ) : null}

          {!conversation && contactFormAvailable ? (
            <div className="mt-5 grid gap-4">
              <fieldset aria-describedby="scan-reason-error">
                <legend className="text-sm font-bold text-[var(--color-ink)]">
                  Reason for contact <span className="font-normal text-[var(--color-danger)]">*</span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Contact reason">
                  {reasons.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={reason === value}
                      onClick={() => setReason(value)}
                      className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-left text-sm font-semibold transition ${
                        reason === value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-card)]"
                          : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-teal-200 hover:bg-[var(--color-primary-soft)]"
                      }`}
                    >
                      <Icon aria-hidden size={16} />
                      {label}
                      {reason === value ? <Check aria-hidden size={16} /> : null}
                    </button>
                  ))}
                </div>
                <FieldError id="scan-reason-error">{errors.reason}</FieldError>
              </fieldset>

              <label className="grid gap-2 text-sm font-semibold text-[var(--color-ink)]" htmlFor="scanner-name">
                Your name, optional
                <input
                  id="scanner-name"
                  value={scannerName}
                  onChange={(event) => setScannerName(event.target.value)}
                  placeholder="e.g. Neighbor, concierge"
                  className="focus-ring min-h-12 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-3 font-normal text-[var(--color-ink)] placeholder:text-[var(--color-muted)]"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[var(--color-ink)]" htmlFor="scan-message">
                Message <span className="font-normal text-[var(--color-danger)]">*</span>
                <textarea
                  id="scan-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby="scan-message-help scan-message-error"
                  placeholder="How can the owner help you?"
                  className="focus-ring min-h-28 resize-none rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-3 font-normal text-[var(--color-ink)] placeholder:text-[var(--color-muted)]"
                />
                <span id="scan-message-help" className="flex items-start gap-2 text-xs font-normal leading-5 text-[var(--color-muted)]">
                  <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                  Do not share sensitive information unless necessary.
                </span>
                <FieldError id="scan-message-error">{errors.message}</FieldError>
              </label>

              <Button type="button" className="min-h-12 w-full" onClick={submitContact} loading={submitting}>
                <Send aria-hidden size={18} />
                Send Private Message
              </Button>
            </div>
          ) : null}

          {!conversation && isActiveTag && !contactFormAvailable ? (
            <div className="mt-4">
              <InlineAlert tone="info">The private message form is not available right now. Owner phone number is still not shown.</InlineAlert>
            </div>
          ) : null}

          {!conversation && canStartPrivateCall ? (
            <div className="mt-4 grid gap-2">
              <Button type="button" variant="secondary" className="min-h-12 w-full border-[var(--color-primary)] text-[var(--color-primary)]" onClick={startPrivateCall} loading={startingCall}>
                <PhoneCall aria-hidden size={18} />
                Start Private Call
              </Button>
              <p className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium leading-5 text-[var(--color-muted)]">
                Your phone number is not shown on this page. Text messages work even if private audio calling is unavailable.
              </p>
            </div>
          ) : null}

          {isActiveTag ? (
            <section className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
              <h2 className="text-base font-bold text-[var(--color-ink)]">Private contact only</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-[var(--color-muted)]">
                Use private message or NoNumQR browser call to contact the owner. The owner&apos;s phone number stays hidden.
              </p>
            </section>
          ) : null}

          <section className="mt-5 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              className="focus-ring mx-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--color-danger)] transition hover:bg-[var(--color-danger-bg)]"
              onClick={() => setReportOpen((value) => !value)}
            >
              <AlertTriangle aria-hidden size={16} />
              Report misuse
            </button>
            <p className="mt-2 text-center text-xs font-medium text-[var(--color-muted)]">Safety tip: Check that the link shows {safetyHost}</p>
          </section>

          {reportOpen ? (
            <section className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
              <h2 className="text-base font-bold text-[var(--color-ink)]">Report misuse</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">Tell us what happened. This does not reveal the owner&apos;s phone number.</p>
              <div className="mt-3 grid gap-3">
                <label className="grid gap-2 text-sm font-semibold text-[var(--color-ink)]" htmlFor="report-reason">
                  Misuse reason
                  <input
                    id="report-reason"
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    aria-invalid={Boolean(errors.report)}
                    aria-describedby="report-error"
                    className="focus-ring min-h-12 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-3 py-3 font-normal"
                  />
                  <FieldError id="report-error">{errors.report}</FieldError>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[var(--color-ink)]" htmlFor="report-details">
                  Details <span className="font-normal text-[var(--color-muted)]">Optional</span>
                  <textarea
                    id="report-details"
                    value={reportDetails}
                    onChange={(event) => setReportDetails(event.target.value)}
                    className="focus-ring min-h-20 resize-none rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-3 py-3 font-normal"
                  />
                </label>
                <Button type="button" variant="danger" onClick={reportAbuse} loading={reporting}>Submit misuse report</Button>
              </div>
            </section>
          ) : null}
        </section>

        <section className="rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white/80 p-4 text-center text-xs leading-5 text-[var(--color-muted)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-center gap-2 font-semibold text-[var(--color-primary)]">
            <Info aria-hidden size={15} />
            NoNumQR privacy reminder
          </div>
          <p className="mt-1">This QR contains only a public URL. Your message will be sent privately to the owner.</p>
        </section>

        {conversation ? <PublicConversation contactRequestId={conversation.id} token={conversation.token} scannerName={scannerName} /> : null}
      </div>
    </main>
  );
}
