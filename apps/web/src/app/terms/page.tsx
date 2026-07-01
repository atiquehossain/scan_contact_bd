import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, FileText, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Terms - NoNumQR",
  description: "Basic terms for using NoNumQR QR tags, private contact pages, owner app, and COD order flow."
};

const terms = [
  {
    title: "Responsible use",
    body: "NoNumQR is for legitimate private contact such as parking, lost-and-found, shop, business, and society communication. Do not use it for harassment, stalking, illegal lookup, impersonation, spam, or exposing private data.",
    Icon: Scale
  },
  {
    title: "QR privacy boundary",
    body: "QR tags contain public NoNumQR URLs only. They should not encode phone numbers, names, addresses, owner IDs, vehicle owner identities, or private profile data.",
    Icon: ShieldCheck
  },
  {
    title: "Private conversations",
    body: "Scanner conversations use private continuation links where available. Expired or inactive conversations may become read-only or unavailable.",
    Icon: LockKeyhole
  },
  {
    title: "Orders and COD",
    body: "Public orders use Cash on Delivery as the working payment method. Online payments should not be treated as production-ready unless explicitly launched later.",
    Icon: FileText
  }
];

export default function TermsPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold text-[var(--color-primary)]">Terms</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">Use NoNumQR responsibly.</h1>
            <p className="section-copy mx-auto mt-4 max-w-2xl">
              These terms summarize safe use of QR tags, private contact pages, owner app access, and COD orders.
            </p>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-5xl gap-4">
            {terms.map(({ title, body, Icon }) => (
              <article key={title} className="premium-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-card bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Icon aria-hidden size={24} />
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                    <p className="mt-3 leading-8 text-[var(--color-muted)]">{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <article className="premium-card border-[var(--color-danger)]/20 bg-[var(--color-danger-bg)] p-6">
              <Ban aria-hidden className="text-[var(--color-danger)]" size={28} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Do not misuse public QR pages</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                Public QR pages should not be used to identify, expose, harass, or profile an owner. Scanners should send only the information needed for the contact reason.
              </p>
            </article>
            <article className="premium-card p-6">
              <FileText aria-hidden className="text-[var(--color-primary)]" size={28} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Operational note</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                Before a commercial launch, verify current Bangladesh telecom, payment, privacy, e-commerce, tax, and consumer-protection requirements from official sources.
              </p>
              <Link href="/contact" className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]">
                Contact support <ArrowRight aria-hidden size={18} />
              </Link>
            </article>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
