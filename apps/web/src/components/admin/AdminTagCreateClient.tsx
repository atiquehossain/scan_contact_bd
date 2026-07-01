"use client";

import { type FormEvent, type InputHTMLAttributes, type ReactNode, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Info,
  LockKeyhole,
  Phone,
  Printer,
  QrCode,
  ShieldCheck,
  Tag,
  UserRound
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, FieldError, InlineAlert, LinkButton, StatusBadge, cx } from "@/components/admin/ui";
import { apiFetch, clientDebugLog, qrImageUrl } from "@/lib/api";

type CreatedAdminTag = {
  id: string;
  publicSlug: string;
  publicUrl: string;
  type: QrTagType;
  label: string;
  vehicleNumber?: string | null;
  itemName?: string | null;
  status: QrTagStatus;
  owner?: { id: string; phone: string; fullName?: string | null } | null;
};

type QrTagType = "CAR" | "MOTORBIKE" | "DELIVERY_BIKE" | "LOST_ITEM" | "BUSINESS_CARD" | "APARTMENT_PARKING" | "SHOP" | "OTHER";
type QrTagStatus = "DRAFT" | "PENDING_ACTIVATION" | "ACTIVE" | "DISABLED" | "LOST" | "TRANSFERRED" | "DELETED";

const tagTypes: QrTagType[] = ["CAR", "MOTORBIKE", "DELIVERY_BIKE", "LOST_ITEM", "BUSINESS_CARD", "APARTMENT_PARKING", "SHOP", "OTHER"];
const vehicleTypes = new Set<QrTagType>(["CAR", "MOTORBIKE", "DELIVERY_BIKE", "APARTMENT_PARKING"]);

function humanize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function validBdPhone(value: string) {
  return /^(\+8801[3-9]\d{8}|01[3-9]\d{8})$/.test(value.trim());
}

function maskOwnerPhone(phone: string) {
  const cleaned = phone.trim();
  if (cleaned.length <= 7) return "***";
  return `${cleaned.slice(0, 5)}****${cleaned.slice(-3)}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character] || character);
}

function FormSection({
  title,
  description,
  eyebrow,
  children
}: {
  title: string;
  description: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 border-b border-[var(--color-border)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-bold text-[var(--color-ink-strong)]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  error,
  helper,
  placeholder,
  icon,
  inputMode,
  autoComplete
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  helper?: string;
  placeholder?: string;
  icon?: ReactNode;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor={id}>
      <span className="flex flex-wrap items-center gap-1">
        {label}
        {required ? <span className="font-semibold text-[var(--color-danger)]">Required</span> : <span className="font-medium text-[var(--color-muted)]">Optional</span>}
      </span>
      <span className="relative">
        {icon ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">{icon}</span> : null}
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={[helper ? helperId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={cx(
            "focus-ring min-h-11 w-full rounded-[var(--radius-button)] border bg-[#f8fbf9] px-3 py-2.5 font-medium text-[var(--color-ink)] placeholder:text-slate-400",
            Boolean(icon) && "pl-10",
            error ? "border-red-300" : "border-[var(--color-border)]"
          )}
          placeholder={placeholder}
        />
      </span>
      {helper ? <span id={helperId} className="text-xs font-medium leading-5 text-[var(--color-muted)]">{helper}</span> : null}
      <FieldError id={errorId}>{error}</FieldError>
    </label>
  );
}

function ReadOnlyBehaviorCard() {
  const items = [
    ["Destination type", "Public QR tag page", "The API generates a public URL after creation."],
    ["Privacy mode", "Private contact only", "Owner phone is not encoded in the QR."],
    ["Scanner contact form", "Enabled", "Scanners can send a private message."],
    ["Direct phone links", "Off", "WhatsApp, SMS, and visible phone are disabled by this admin flow."]
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value, detail]) => (
        <div key={label} className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</p>
          <p className="mt-2 text-sm font-bold text-[var(--color-ink-strong)]">{value}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{detail}</p>
        </div>
      ))}
    </div>
  );
}

export function AdminTagCreateClient() {
  const router = useRouter();
  const alertRef = useRef<HTMLDivElement>(null);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [type, setType] = useState<QrTagType>("CAR");
  const [label, setLabel] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [itemName, setItemName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdTag, setCreatedTag] = useState<CreatedAdminTag | null>(null);

  const showVehicleHelper = useMemo(() => vehicleTypes.has(type), [type]);

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!ownerPhone.trim()) nextErrors.ownerPhone = "Owner phone number is required.";
    else if (!validBdPhone(ownerPhone)) nextErrors.ownerPhone = "Use 01XXXXXXXXX or +8801XXXXXXXXX format.";
    if (!ownerName.trim()) nextErrors.ownerName = "Owner name is required.";
    if (!label.trim()) nextErrors.label = "Tag label is required.";
    if (label.trim().length > 80) nextErrors.label = "Tag label must be 80 characters or less.";
    if (vehicleNumber.trim().length > 30) nextErrors.vehicleNumber = "Vehicle number must be 30 characters or less.";
    if (itemName.trim().length > 80) nextErrors.itemName = "Item name must be 80 characters or less.";
    return nextErrors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    clientDebugLog("admin.tags.create.submit", {
      ownerPhone: maskOwnerPhone(ownerPhone),
      ownerNamePresent: Boolean(ownerName.trim()),
      type,
      labelPresent: Boolean(label.trim()),
      errorFields: Object.keys(nextErrors).join(",")
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setMessage("Please fix the highlighted fields.");
      window.setTimeout(() => alertRef.current?.focus(), 0);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ tag: CreatedAdminTag }>("/admin/tags", {
        method: "POST",
        body: JSON.stringify({
          ownerPhone: ownerPhone.trim(),
          ownerName: ownerName.trim(),
          type,
          label: label.trim(),
          vehicleNumber: vehicleNumber.trim() || undefined,
          itemName: itemName.trim() || undefined,
          privacyMode: "PRIVATE_CONTACT_ONLY",
          contactSettings: {
            allowContactForm: true,
            allowWhatsapp: false,
            allowSms: false,
            phoneVisible: false,
            showName: false,
            showEmergency: false
          }
        })
      });
      setCreatedTag(data.tag);
      setErrors({});
      setMessage("QR tag created successfully. Opening the detail page...");
      window.setTimeout(() => router.push(`/admin/tags/${data.tag.id}`), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create tag.");
      window.setTimeout(() => alertRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
  }

  async function copyCreatedUrl() {
    if (!createdTag) return;
    await navigator.clipboard.writeText(createdTag.publicUrl);
    setMessage("Public URL copied.");
  }

  function printCreatedQr() {
    if (!createdTag) return;
    const win = window.open("", "_blank", "noopener,noreferrer,width=520,height=720");
    if (!win) return;
    const safeLabel = escapeHtml(createdTag.label);
    const safeType = escapeHtml(createdTag.type);
    const safeImageUrl = escapeHtml(qrImageUrl(createdTag.publicSlug));
    const safePublicUrl = escapeHtml(createdTag.publicUrl);
    win.document.write(`
      <html><head><title>${safeLabel}</title></head>
      <body style="font-family:Arial,sans-serif;text-align:center;padding:32px">
        <h1>${safeLabel}</h1>
        <p>${safeType}</p>
        <img src="${safeImageUrl}" style="width:320px;height:320px" />
        <p style="word-break:break-all">${safePublicUrl}</p>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <AdminShell>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <Link href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</Link>
              <span aria-hidden>/</span>
              <Link href="/admin/tags" className="font-bold text-[var(--color-primary)] hover:underline">Tags</Link>
              <span aria-hidden>/</span>
              <span>Create</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">QR tag operations</p>
            <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Create tag</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">Create a new QR/contact tag and configure where the current API can point it.</p>
          </div>
          <LinkButton href="/admin/tags" variant="secondary" className="shrink-0">
            <ArrowLeft aria-hidden size={16} />
            Back to tags
          </LinkButton>
        </header>

        {message ? (
          <div ref={alertRef} tabIndex={-1}>
            <InlineAlert tone={createdTag ? "success" : Object.keys(errors).length ? "danger" : "warning"}>{message}</InlineAlert>
          </div>
        ) : null}

        {createdTag ? (
          <section className="rounded-[var(--radius-card)] border border-emerald-200 bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-button)] border border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-text)]">
                  <CheckCircle2 aria-hidden className="h-5 w-5" />
                </span>
                <div>
                  <StatusBadge tone="success">Created</StatusBadge>
                  <h2 className="mt-2 text-xl font-bold text-[var(--color-ink-strong)]">{createdTag.label}</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">The QR tag was created with private contact settings. Use the actions below to copy, download, print, open, or inspect the tag.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={copyCreatedUrl}>
                  <Copy aria-hidden size={16} />
                  Copy public URL
                </Button>
                <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]" href={qrImageUrl(createdTag.publicSlug)} download={`${createdTag.publicSlug}.png`}>
                  <Download aria-hidden size={16} />
                  Download PNG
                </a>
                <Button type="button" variant="secondary" onClick={printCreatedQr}>
                  <Printer aria-hidden size={16} />
                  Print QR
                </Button>
                <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]" href={`/t/${createdTag.publicSlug}`} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden size={16} />
                  Open public page
                </a>
                {createdTag.owner?.id ? <LinkButton href={`/admin/owners/${createdTag.owner.id}`} variant="secondary">View owner</LinkButton> : null}
                <LinkButton href={`/admin/tags/${createdTag.id}`}>
                  View tag detail
                  <ArrowRight aria-hidden size={16} />
                </LinkButton>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-3">
                <img src={qrImageUrl(createdTag.publicSlug)} alt={`${createdTag.label} QR code`} className="aspect-square w-full rounded-[var(--radius-button)] bg-white p-2" />
              </div>
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3"><dt className="text-[var(--color-muted)]">Public URL</dt><dd className="mt-1 break-all font-bold text-[var(--color-ink)]">{createdTag.publicUrl}</dd></div>
                <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3"><dt className="text-[var(--color-muted)]">Owner</dt><dd className="mt-1 font-bold text-[var(--color-ink)]">{createdTag.owner?.fullName || ownerName}</dd></div>
                <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3"><dt className="text-[var(--color-muted)]">Type</dt><dd className="mt-1 font-bold text-[var(--color-ink)]">{humanize(createdTag.type)}</dd></div>
                <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3"><dt className="text-[var(--color-muted)]">Status</dt><dd className="mt-1"><StatusBadge tone="success">{createdTag.status}</StatusBadge></dd></div>
              </dl>
            </div>
          </section>
        ) : null}

        {!createdTag ? (
          <form className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]" onSubmit={submit} noValidate>
            <div className="grid gap-5">
              <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
                <ol className="grid gap-2 sm:grid-cols-4" aria-label="Create QR tag progress">
                  {["Owner", "Tag details", "Privacy settings", "Review/create"].map((item, index) => (
                    <li key={item} className="rounded-[var(--radius-button)] border border-teal-100 bg-[var(--color-primary-soft)] p-3">
                      <span className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">{index + 1}</span>
                        <span className="text-xs font-bold uppercase tracking-[0.04em] text-[var(--color-primary-hover)]">{item}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
              <FormSection eyebrow="Section 1" title="Tag basics" description="Use the fields supported by the current tag creation API. Slug and status are generated server-side.">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="tag-type">
                    Tag type <span className="font-semibold text-[var(--color-danger)]">Required</span>
                    <select
                      id="tag-type"
                      value={type}
                      onChange={(event) => setType(event.target.value as QrTagType)}
                      className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 font-medium text-[var(--color-ink)]"
                    >
                      {tagTypes.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
                    </select>
                  </label>
                  <TextField id="tag-label" label="Tag name" value={label} onChange={setLabel} required error={errors.label} placeholder="NoNumQR Car Sticker" icon={<Tag aria-hidden className="h-4 w-4" />} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    id="vehicle-number"
                    label="Vehicle number"
                    value={vehicleNumber}
                    onChange={setVehicleNumber}
                    error={errors.vehicleNumber}
                    helper={showVehicleHelper ? "Stored for admin support; not shown publicly by this flow." : "Optional admin reference if useful."}
                    placeholder="DHAKA METRO GA 12-3456"
                  />
                  <TextField id="item-name" label="Item name" value={itemName} onChange={setItemName} error={errors.itemName} helper="Supported by the API for item-style tags." placeholder="Laptop bag, counter tag, shop desk" />
                </div>
              </FormSection>

              <FormSection eyebrow="Section 2" title="Destination / behavior" description="The current backend creates a public QR URL. It does not accept a custom destination URL in this admin flow.">
                <ReadOnlyBehaviorCard />
                <InlineAlert tone="info" title="Public URL only">
                  The QR image points to the generated NoNumQR public page. No owner phone, owner ID, address, or private profile data is encoded in the QR.
                </InlineAlert>
              </FormSection>

              <FormSection eyebrow="Section 3" title="Ownership / assignment" description="Assign the tag to an owner. The API creates or updates the owner account by phone number.">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    id="owner-phone"
                    label="Owner phone"
                    value={ownerPhone}
                    onChange={setOwnerPhone}
                    required
                    error={errors.ownerPhone}
                    helper="Use 01XXXXXXXXX or +8801XXXXXXXXX."
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                    autoComplete="tel"
                    icon={<Phone aria-hidden className="h-4 w-4" />}
                  />
                  <TextField
                    id="owner-name"
                    label="Owner name"
                    value={ownerName}
                    onChange={setOwnerName}
                    required
                    error={errors.ownerName}
                    placeholder="Owner full name"
                    autoComplete="name"
                    icon={<UserRound aria-hidden className="h-4 w-4" />}
                  />
                </div>
              </FormSection>
            </div>

            <aside className="grid content-start gap-4">
              <section className="rounded-[var(--radius-card)] border border-teal-200 bg-[var(--color-primary-soft)] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <div>
                    <h2 className="text-sm font-bold text-[var(--color-ink-strong)]">Private by default</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-primary-hover)]">This page preserves the current private-contact payload: contact form on, direct phone links off, phone hidden.</p>
                  </div>
                </div>
              </section>
              <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
                <h2 className="text-sm font-bold text-[var(--color-ink-strong)]">Create summary</h2>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><dt className="text-[var(--color-muted)]">Status</dt><dd><StatusBadge tone="success">Active on create</StatusBadge></dd></div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><dt className="text-[var(--color-muted)]">QR content</dt><dd className="font-bold text-[var(--color-ink)]">Public URL</dd></div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><dt className="text-[var(--color-muted)]">Draft support</dt><dd><StatusBadge tone="neutral">Not in API</StatusBadge></dd></div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><dt className="text-[var(--color-muted)]">Custom URL</dt><dd><StatusBadge tone="neutral">Not in API</StatusBadge></dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="submit" loading={loading}>
                    <QrCode aria-hidden size={16} />
                    Create tag
                  </Button>
                  <LinkButton href="/admin/tags" variant="secondary">Cancel</LinkButton>
                </div>
              </section>
              <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-button)] border border-blue-200 bg-[var(--color-info-soft)] text-[var(--color-info)]">
                    <Info aria-hidden className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--color-ink-strong)]">Admin notes</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">Internal notes and campaigns are not part of the current create response, so this page does not submit them.</p>
                  </div>
                </div>
              </section>
              <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3">
                  <LockKeyhole aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                  <p className="text-sm leading-6 text-[var(--color-muted)]">Admin auth and role checks are handled by the existing admin shell. This form only calls the existing create endpoint.</p>
                </div>
              </section>
            </aside>
          </form>
        ) : null}
      </div>
    </AdminShell>
  );
}
