"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ExternalLink, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { API_BASE, APP_NAME, apiFetch } from "@/lib/api";
import { PublicConversation } from "@/components/PublicConversation";
import { Button, FieldError, InlineAlert, LoadingState } from "@/components/admin/ui";

const reasons = [
  ["VEHICLE_BLOCKING", "Vehicle is blocking"],
  ["LIGHT_ON", "Light is on"],
  ["VEHICLE_DAMAGED", "Vehicle may be damaged"],
  ["OTHER", "Other"]
];

function friendlyType(type?: string) {
  if (!type) return "Private QR contact";
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
      return "Private QR contact";
  }
}

function publicSlugFromLocation(fallback?: string) {
  if (typeof window === "undefined") return fallback || "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const value = parts[0] === "t" ? parts[1] : fallback || "";
  return value && !value.startsWith("__") ? decodeURIComponent(value) : fallback || "";
}

export function ScanClient({ slug: initialSlug }: { slug?: string }) {
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [conversation, setConversation] = useState<{ id: string; token: string; url: string } | null>(null);
  const safetyHost = useMemo(() => {
    if (typeof window === "undefined") return "scancontactbd.com";
    return window.location.hostname || "scancontactbd.com";
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
    const saved = window.localStorage.getItem(`scancontact:conversation:${slug}`);
    if (saved) {
      try {
        setConversation(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem(`scancontact:conversation:${slug}`);
      }
    }
  }, [slug]);

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
      const data = await apiFetch<{ contactRequestId: string; conversationToken: string; conversationUrl: string }>(
        `/t/${slug}/contact`,
        {
          method: "POST",
          body: JSON.stringify({ reason, message: message.trim(), scannerName: scannerName.trim() || undefined })
        },
        ""
      );
      const nextConversation = { id: data.contactRequestId, token: data.conversationToken, url: data.conversationUrl };
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

  const contactLinks = [tag?.links?.whatsapp ? "whatsapp" : null, tag?.links?.sms ? "sms" : null].filter(Boolean);

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] px-4 py-6">
      <section className="mx-auto w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <header className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white">
            <ShieldCheck aria-hidden size={25} />
          </span>
          <p className="mt-3 text-base font-black text-[var(--color-ink)]">{APP_NAME}</p>
          <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">Private QR contact</p>
        </header>

        <div className="mt-6 border-t border-[var(--color-border)] pt-5">
          {loadingTag ? <LoadingState label="Loading QR page..." /> : null}
          {!loadingTag ? (
            <>
              <h1 className="text-2xl font-black text-[var(--color-ink)]">{tag?.label || friendlyType(tag?.type)}</h1>
              <p className="mt-1 text-sm font-bold text-[var(--color-muted)]">{purposeCopy(tag?.type)}</p>
            </>
          ) : null}
        </div>

        <section className="mt-5 rounded-[var(--radius-card)] border border-emerald-200 bg-[var(--color-success-bg)] p-4 text-sm text-[var(--color-success-text)]">
          <h2 className="font-black">Private by default</h2>
          <ul className="mt-3 grid gap-2">
            <li className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />Send a private message to the owner</li>
            <li className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />Your phone number is hidden unless you choose to share it</li>
            <li className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />This QR contains no personal details</li>
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

          {conversation ? (
            <a className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary)]" href={conversation.url}>
              <ExternalLink aria-hidden size={16} />
              Continue conversation
            </a>
          ) : null}
        </div>

        {contactLinks.length ? (
          <section className="mt-6 border-t border-[var(--color-border)] pt-5">
            <h2 className="text-base font-black text-[var(--color-ink)]">Other contact options</h2>
            <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">Shown only if enabled by owner</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {tag?.links?.whatsapp ? <a className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-3 font-bold" href={tag.links.whatsapp}><MessageSquare aria-hidden size={18} /> WhatsApp</a> : null}
              {tag?.links?.sms ? <a className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-3 font-bold" href={tag.links.sms}><MessageSquare aria-hidden size={18} /> SMS</a> : null}
            </div>
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
