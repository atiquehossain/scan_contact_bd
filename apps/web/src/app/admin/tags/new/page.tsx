"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { CheckCircle2, Copy, Download, ExternalLink, Printer, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, FieldError, InlineAlert, LinkButton, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { apiFetch, qrImageUrl } from "@/lib/api";

type AdminTag = {
  id: string;
  publicSlug: string;
  publicUrl: string;
  type: string;
  label: string;
  status: string;
  owner?: { id: string; phone: string; fullName?: string | null };
};

const tagTypes = ["CAR", "MOTORBIKE", "DELIVERY_BIKE", "LOST_ITEM", "BUSINESS_CARD", "APARTMENT_PARKING", "SHOP", "OTHER"];
const vehicleTypes = new Set(["CAR", "MOTORBIKE", "DELIVERY_BIKE", "APARTMENT_PARKING"]);

function validBdPhone(value: string) {
  return /^(\+8801\d{9}|01\d{9})$/.test(value.trim());
}

export default function CreateTagPage() {
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [type, setType] = useState("CAR");
  const [label, setLabel] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdTag, setCreatedTag] = useState<AdminTag | null>(null);

  const showVehicleHelp = useMemo(() => vehicleTypes.has(type), [type]);

  function validateStep(targetStep = step) {
    const nextErrors: Record<string, string> = {};
    if (targetStep >= 1) {
      if (!ownerPhone.trim()) nextErrors.ownerPhone = "Owner phone number is required.";
      else if (!validBdPhone(ownerPhone)) nextErrors.ownerPhone = "Use 01XXXXXXXXX or +8801XXXXXXXXX format.";
      if (!ownerName.trim()) nextErrors.ownerName = "Owner name is required.";
    }
    if (targetStep >= 2) {
      if (!type) nextErrors.type = "Tag type is required.";
      if (!label.trim()) nextErrors.label = "Tag label is required.";
    }
    return nextErrors;
  }

  function moveNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateStep(step);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setSummary("Please fix the highlighted fields.");
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }
    setErrors({});
    setSummary("");
    setStep((value) => Math.min(value + 1, 3));
  }

  async function createTag() {
    const nextErrors = validateStep(3);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setSummary("Please fix the highlighted fields.");
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }
    setLoading(true);
    setSummary("");
    try {
      const data = await apiFetch<{ tag: AdminTag }>("/admin/tags", {
        method: "POST",
        body: JSON.stringify({
          ownerPhone: ownerPhone.trim(),
          ownerName: ownerName.trim(),
          type,
          label: label.trim(),
          vehicleNumber: vehicleNumber.trim() || undefined,
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
      setSummary("");
    } catch (error) {
      setSummary(error instanceof Error ? error.message : "Could not create QR tag.");
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    if (!createdTag) return;
    await navigator.clipboard.writeText(createdTag.publicUrl);
    setSummary("QR public URL copied.");
  }

  function printQr() {
    if (!createdTag) return;
    const win = window.open("", "_blank", "noopener,noreferrer,width=520,height=720");
    if (!win) return;
    win.document.write(`
      <html><head><title>${createdTag.label}</title></head>
      <body style="font-family:Arial,sans-serif;text-align:center;padding:32px">
        <h1>${createdTag.label}</h1>
        <p>${createdTag.type}</p>
        <img src="${qrImageUrl(createdTag.publicSlug)}" style="width:320px;height:320px" />
        <p style="word-break:break-all">${createdTag.publicUrl}</p>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  function resetForm() {
    setStep(1);
    setOwnerPhone("");
    setOwnerName("");
    setType("CAR");
    setLabel("");
    setVehicleNumber("");
    setCreatedTag(null);
    setErrors({});
    setSummary("");
  }

  return (
    <AdminShell>
      <PageHeader
        title="Create New Tag"
        description="Create a unique QR tag and assign it to an owner phone number. Owners use the Flutter app to see alerts and reply."
        breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Tags" }, { label: "Create New Tag" }]}
      />

      {summary ? (
        <div ref={errorSummaryRef} tabIndex={-1} className="mb-4">
          <InlineAlert tone={createdTag ? "success" : "danger"}>{summary}</InlineAlert>
        </div>
      ) : null}

      {createdTag ? (
        <Panel title="Created QR Preview" description="This QR contains only the public scan URL. No owner private data is encoded.">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4">
              <img src={qrImageUrl(createdTag.publicSlug)} alt={`${createdTag.label} QR code`} className="aspect-square w-full" />
            </div>
            <div>
              <InlineAlert tone="success" title="QR tag created successfully.">
                The owner can log in or sign up in the Flutter owner app with {ownerPhone.trim()}.
              </InlineAlert>
              <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                <div><dt className="font-bold text-[var(--color-muted)]">Tag label</dt><dd className="mt-1 font-black">{createdTag.label}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Tag type</dt><dd className="mt-1 font-black">{createdTag.type}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Status</dt><dd className="mt-1"><StatusBadge tone="success">{createdTag.status}</StatusBadge></dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Owner</dt><dd className="mt-1 font-black">{createdTag.owner?.fullName || ownerName}</dd></div>
              </dl>
              <p className="mt-5 break-all rounded-[var(--radius-card)] bg-[#f8fbf9] p-3 text-sm font-bold">{createdTag.publicUrl}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={copyUrl}><Copy aria-hidden size={16} />Copy URL</Button>
                <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold" href={qrImageUrl(createdTag.publicSlug)} download={`${createdTag.publicSlug}.png`}>
                  <Download aria-hidden size={16} />Download PNG
                </a>
                <Button variant="secondary" onClick={printQr}><Printer aria-hidden size={16} />Print QR</Button>
                <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold" href={`/t/${createdTag.publicSlug}`} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden size={16} />Open public page
                </a>
                <Button onClick={resetForm}><RotateCcw aria-hidden size={16} />Create another tag</Button>
                {createdTag.owner?.id ? <LinkButton href={`/admin/owners/${createdTag.owner.id}`} variant="secondary">View owner</LinkButton> : null}
                <LinkButton href={`/admin/tags/${createdTag.id}`} variant="secondary">View tag detail</LinkButton>
              </div>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel title={`Step ${step} of 3`} description={step === 1 ? "Owner Details" : step === 2 ? "Tag Details" : "Review and Create"}>
          <div className="mb-5 flex gap-2" aria-label="Create tag progress">
            {[1, 2, 3].map((item) => <span key={item} className={`h-2 flex-1 rounded-full ${item <= step ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`} />)}
          </div>

          {step === 1 ? (
            <form className="grid max-w-2xl gap-4" onSubmit={moveNext} noValidate>
              <label className="grid gap-2 text-sm font-bold" htmlFor="owner-phone">Owner phone number <span className="font-normal text-[var(--color-danger)]">Required</span>
                <input id="owner-phone" value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} aria-invalid={Boolean(errors.ownerPhone)} aria-describedby="owner-phone-help owner-phone-error" className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal" />
                <span id="owner-phone-help" className="text-xs font-normal text-[var(--color-muted)]">Use 01XXXXXXXXX or +8801XXXXXXXXX.</span>
                <FieldError id="owner-phone-error">{errors.ownerPhone}</FieldError>
              </label>
              <label className="grid gap-2 text-sm font-bold" htmlFor="owner-name">Owner name <span className="font-normal text-[var(--color-danger)]">Required</span>
                <input id="owner-name" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} aria-invalid={Boolean(errors.ownerName)} aria-describedby="owner-name-error" className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal" />
                <FieldError id="owner-name-error">{errors.ownerName}</FieldError>
              </label>
              <div><Button type="submit">Continue to Tag Details</Button></div>
            </form>
          ) : null}

          {step === 2 ? (
            <form className="grid max-w-2xl gap-4" onSubmit={moveNext} noValidate>
              <label className="grid gap-2 text-sm font-bold" htmlFor="tag-type">Tag type <span className="font-normal text-[var(--color-danger)]">Required</span>
                <select id="tag-type" value={type} onChange={(event) => setType(event.target.value)} className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal">
                  {tagTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold" htmlFor="tag-label">Tag label <span className="font-normal text-[var(--color-danger)]">Required</span>
                <input id="tag-label" value={label} onChange={(event) => setLabel(event.target.value)} aria-invalid={Boolean(errors.label)} aria-describedby="tag-label-error" className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal" />
                <FieldError id="tag-label-error">{errors.label}</FieldError>
              </label>
              <label className="grid gap-2 text-sm font-bold" htmlFor="vehicle-number">Vehicle number <span className="font-normal text-[var(--color-muted)]">Optional</span>
                <input id="vehicle-number" value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} aria-describedby={showVehicleHelp ? "vehicle-number-help" : undefined} className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal" />
                {showVehicleHelp ? <span id="vehicle-number-help" className="text-xs font-normal text-[var(--color-muted)]">Add the vehicle number only if it helps admin support. It is not shown publicly by default.</span> : null}
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit">Continue to Review</Button>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <div className="max-w-2xl">
              <dl className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-4 text-sm md:grid-cols-2">
                <div><dt className="font-bold text-[var(--color-muted)]">Owner name</dt><dd className="mt-1 font-black">{ownerName}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Owner phone</dt><dd className="mt-1 font-black">{ownerPhone}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Tag type</dt><dd className="mt-1 font-black">{type}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Tag label</dt><dd className="mt-1 font-black">{label}</dd></div>
                {vehicleNumber ? <div><dt className="font-bold text-[var(--color-muted)]">Vehicle number</dt><dd className="mt-1 font-black">{vehicleNumber}</dd></div> : null}
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={loading}>Back</Button>
                <Button type="button" onClick={createTag} loading={loading}><CheckCircle2 aria-hidden size={16} />Create Owner QR</Button>
              </div>
            </div>
          ) : null}
        </Panel>
      )}
    </AdminShell>
  );
}
