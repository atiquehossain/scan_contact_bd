"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ExternalLink, MessageSquare, PhoneCall, QrCode, Send, ShieldCheck } from "lucide-react";
import { API_BASE, APP_NAME, apiFetch } from "@/lib/api";
import { BRAND_PROMISE, PRIVATE_QR_CONTACT, contactContextTitle, safePublicLabel } from "@/lib/brand";
import { PublicConversation } from "@/components/PublicConversation";
import { Button, FieldError, InlineAlert, LoadingState } from "@/components/admin/ui";

const reasons = [
  ["VEHICLE_BLOCKING", "Vehicle is blocking"],
  ["LIGHT_ON", "Light is on"],
  ["VEHICLE_DAMAGED", "Vehicle may be damaged"],
  ["OTHER", "Other"]
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
  const [safetyHost, setSafetyHost] = useState("scancontactbd.com");

  useEffect(() => {
    setSafetyHost(window.location.hostname || "scancontactbd.com");
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
    const storageKey = `scancontact:conversation:${publicSlug}`;
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
    if (slug) window.localStorage.removeItem(`scancontact:conversation:${slug}`);
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
      window.localStorage.setItem(`scancontact:conversation:${slug}`, JSON.stringify(nextConversation));
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
      setStatus("Report submitted. Thank you for helping keep ScanContact safe.");
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

  const contactLinks = [tag?.links?.whatsapp ? "whatsapp" : null, tag?.links?.sms ? "sms" : null].filter(Boolean);

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] px-4 py-6">
      <section className="mx-auto w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <header className="text-center">
          <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <QrCode aria-hidden size={27} />
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-primary)] text-white ring-2 ring-white">
              <PhoneCall aria-hidden size={13} />
            </span>
            <span className="absolute -bottom-1 -left-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[var(--color-primary)] ring-1 ring-[var(--color-border)]">
              <ShieldCheck aria-hidden size={13} />
            </span>
          </span>
          <p className="mt-3 text-base font-black text-[var(--color-ink)]">{APP_NAME}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-[var(--color-muted)]">{BRAND_PROMISE}</p>
        </header>

        <div className="mt-6 border-t border-[var(--color-border)] pt-5">
          {loadingTag ? <LoadingState label="Loading QR page..." /> : null}
          {!loadingTag ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">{PRIVATE_QR_CONTACT}</p>
              <h1 className="mt-2 text-2xl font-black text-[var(--color-ink)]">{contactContextTitle(tag?.type, tag?.label)}</h1>
              <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">{purposeCopy(tag?.type)}</p>
              {tag?.label ? (
                <p className="mt-3 inline-flex rounded-full border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-1 text-xs font-bold text-[var(--color-muted)]">
                  Tag: {safePublicLabel(tag.label)}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <section className="mt-5 rounded-[var(--radius-card)] border border-emerald-200 bg-[var(--color-success-bg)] p-4 text-sm text-[var(--color-success-text)]">
          <h2 className="font-black">Private by default</h2>
          <ul className="mt-3 grid gap-2">
            <li className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />Send a private message to the owner</li>
            <li className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />Phone numbers stay hidden through {APP_NAME}</li>
            <li className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />This QR tag contains only a public contact link</li>
          </ul>
        </section>

        {tag?.status && tag.status !== "ACTIVE" ? (
          <div className="mt-4">
            <InlineAlert tone="warning">This QR tag is {String(tag.status).toLowerCase()}.</InlineAlert>
          </div>
        ) : null}

        {status ? (
          <div ref={errorSummaryRef} tabIndex={-1} className="mt-4">
            <InlineAlert tone={status.includes("sent") || status.includes("submitted") ? "success" : "warning"}>{status}</InlineAlert>
          </div>
        ) : null}

        {validatingSavedConversation ? (
          <div className="mt-5">
            <LoadingState label="Checking for an active conversation..." />
          </div>
        ) : null}

        {conversation ? (
          <section className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
            <h2 className="text-base font-black text-[var(--color-ink)]">You already have an active conversation.</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Continue the private chat, or start a new message if this is a different issue.</p>
            {conversation.expiresAt ? (
              <p className="mt-2 text-xs font-bold text-[var(--color-muted)]">Active until {new Date(conversation.expiresAt).toLocaleString()}</p>
            ) : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <a className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white" href={conversation.url}>
                <ExternalLink aria-hidden size={16} />
                Continue chat
              </a>
              <button
                type="button"
                className="focus-ring inline-flex min-h-12 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary)]"
                onClick={startNewMessage}
              >
                Start new message
              </button>
            </div>
          </section>
        ) : null}

        {!conversation ? (
        <div className="mt-5 grid gap-4">
          <fieldset aria-describedby="scan-reason-error">
            <legend className="text-sm font-black text-[var(--color-ink)]">
              Why are you contacting the owner? <span className="font-normal text-[var(--color-danger)]">*</span>
            </legend>
            <div className="mt-2 grid gap-2" role="radiogroup" aria-label="Contact reason">
              {reasons.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={reason === value}
                  onClick={() => setReason(value)}
                  className={`focus-ring flex min-h-12 items-center justify-between rounded-[var(--radius-button)] border px-4 py-3 text-left text-sm font-bold ${
                    reason === value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]"
                      : "border-[var(--color-border)] bg-white text-[var(--color-ink)]"
                  }`}
                >
                  {label}
                  {reason === value ? <Check aria-hidden size={18} /> : null}
                </button>
              ))}
            </div>
            <FieldError id="scan-reason-error">{errors.reason}</FieldError>
          </fieldset>

          <label className="grid gap-2 text-sm font-bold" htmlFor="scanner-name">
            Your name, optional
            <input id="scanner-name" value={scannerName} onChange={(event) => setScannerName(event.target.value)} className="focus-ring min-h-12 rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-bold" htmlFor="scan-message">
            Message <span className="font-normal text-[var(--color-danger)]">*</span>
            <textarea id="scan-message" value={message} onChange={(event) => setMessage(event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby="scan-message-help scan-message-error" className="focus-ring min-h-28 rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal" />
            <span id="scan-message-help" className="text-xs font-normal text-[var(--color-muted)]">Do not include sensitive information unless needed.</span>
            <FieldError id="scan-message-error">{errors.message}</FieldError>
          </label>

          <Button onClick={submitContact} loading={submitting}>
            <Send aria-hidden size={18} />
            Send request privately
          </Button>

          <Button variant="secondary" onClick={startPrivateCall} loading={startingCall}>
            <PhoneCall aria-hidden size={18} />
            Start private owner call
          </Button>

          <p className="text-xs font-semibold leading-5 text-[var(--color-muted)]">
            Your phone number stays hidden. ScanContact BD connects the call privately through this QR link.
          </p>

        </div>
        ) : null}

        {contactLinks.length ? (
          <section className="mt-6 border-t border-[var(--color-border)] pt-5">
            <h2 className="text-base font-black text-[var(--color-ink)]">Other contact options</h2>
            <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">Shown only if enabled by owner</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {tag?.links?.whatsapp ? <a className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-3 font-bold" href={tag.links.whatsapp}><MessageSquare aria-hidden size={18} /> WhatsApp</a> : null}
              {tag?.links?.sms ? <a className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-3 font-bold" href={tag.links.sms}><MessageSquare aria-hidden size={18} /> SMS</a> : null}
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-[var(--color-muted)]">
              WhatsApp or SMS may use phone-number based apps. Use the private request first if you want ScanContact BD privacy.
            </p>
          </section>
        ) : null}

        <section className="mt-6 border-t border-[var(--color-border)] pt-5">
          <Button variant="secondary" className="w-full" onClick={() => setReportOpen((value) => !value)}>
            <AlertTriangle aria-hidden size={18} />
            Report abuse
          </Button>
          <p className="mt-3 text-center text-xs font-bold text-[var(--color-muted)]">Safety tip: Check that the link shows {safetyHost}</p>
        </section>

        {reportOpen ? (
          <section className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
            <h2 className="font-black">Report abuse</h2>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-sm font-bold" htmlFor="report-reason">Abuse reason
                <input id="report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)} aria-invalid={Boolean(errors.report)} aria-describedby="report-error" className="focus-ring min-h-12 rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal" />
                <FieldError id="report-error">{errors.report}</FieldError>
              </label>
              <label className="grid gap-2 text-sm font-bold" htmlFor="report-details">Details <span className="font-normal text-[var(--color-muted)]">Optional</span>
                <textarea id="report-details" value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} className="focus-ring min-h-20 rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal" />
              </label>
              <Button variant="danger" onClick={reportAbuse} loading={reporting}>Submit abuse report</Button>
            </div>
          </section>
        ) : null}

        {conversation ? <PublicConversation contactRequestId={conversation.id} token={conversation.token} scannerName={scannerName} /> : null}
      </section>
    </main>
  );
}
