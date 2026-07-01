import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, Flag, HelpCircle, LifeBuoy, PackageSearch, Store } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Contact - NoNumQR",
  description: "Contact NoNumQR for QR tag orders, reseller questions, and society or business bulk QR sticker support."
};

const supportOptions = [
  { title: "Order support", body: "Use order tracking for QR tag delivery and COD status updates.", href: "/track-order", cta: "Track order", Icon: PackageSearch },
  { title: "Abuse or misuse", body: "Use the report option on public scan pages when a QR message looks suspicious or abusive.", href: "/privacy", cta: "Read privacy rules", Icon: Flag },
  { title: "Business inquiry", body: "Ask about shop, business card, apartment, society, or reseller QR tag needs.", href: "/reseller", cta: "Reseller info", Icon: Building2 }
] satisfies Array<{ title: string; body: string; href: string; cta: string; Icon: LucideIcon }>;

export default function ContactPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="privacy-badge px-3 py-2 text-sm font-bold">
                <LifeBuoy aria-hidden size={16} />
                Support and inquiries
              </p>
              <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
                Need help with NoNumQR tags?
              </h1>
              <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">
                Get help with QR tag orders, privacy questions, abuse reports, business use cases, or bulk/reseller inquiries.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/buy" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]">
                  Buy QR Tag <ArrowRight aria-hidden size={18} />
                </Link>
                <Link href="/track-order" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft border border-[var(--color-border-strong)] bg-white px-6 py-3 font-bold text-[var(--color-ink)] shadow-soft transition hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]">
                  Track Order
                </Link>
              </div>
            </div>
            <article className="premium-card p-6">
              <HelpCircle aria-hidden className="text-[var(--color-primary)]" size={30} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Support channels</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                Use the checkout and order tracking flows for product orders. For operator-managed support, use the configured NoNumQR support email or support process for your deployment.
              </p>
              <p className="mt-4 rounded-card bg-[var(--color-page-bg)] p-4 text-sm font-semibold leading-6 text-[var(--color-muted)]">
                No fake phone numbers, addresses, or social links are shown here.
              </p>
            </article>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <SectionIntro eyebrow="Support paths" title="Choose the support path that matches your need." />
          <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-3">
            {supportOptions.map(({ title, body, href, cta, Icon }) => (
              <article key={title} className="premium-card soft-hover flex h-full flex-col p-6">
                <Icon aria-hidden className="text-[var(--color-primary)]" size={26} />
                <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                <p className="mt-3 leading-7 text-[var(--color-muted)]">{body}</p>
                <Link href={href} className="focus-ring mt-auto inline-flex min-h-11 items-center gap-2 pt-6 font-bold text-[var(--color-primary)]">
                  {cta} <ArrowRight aria-hidden size={16} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <article className="premium-card p-6">
              <Flag aria-hidden className="text-[var(--color-danger)]" size={28} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Abuse and report guidance</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                If a public QR interaction is abusive or suspicious, use the report action on the scan page whenever available. Avoid sharing sensitive personal details in scanner messages.
              </p>
            </article>
            <article className="premium-card p-6">
              <Store aria-hidden className="text-[var(--color-primary)]" size={28} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Business and reseller inquiries</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                NoNumQR can support shops, businesses, apartment parking, societies, and bulk tag programs through an operator-managed process.
              </p>
              <Link href="/reseller" className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]">
                View reseller program <ArrowRight aria-hidden size={18} />
              </Link>
            </article>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
