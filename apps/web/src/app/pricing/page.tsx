import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Check, CreditCard, LockKeyhole, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";
import { FinalCTA, PricingSection } from "@/components/public/PublicSections";

export const metadata: Metadata = {
  title: "Pricing - NoNumQR QR Tags",
  description: "Simple QR tag and QR sticker pricing for NoNumQR with Cash on Delivery support."
};

const privacyFeatures = ["Only a public URL is inside the QR", "Your phone number stays private", "Private scanner chat", "Owner app access", "Token-protected conversations", "Conversation expiry support"];

export default function PricingPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="privacy-badge px-3 py-2 text-sm font-bold">
                <BadgeDollarSign aria-hidden size={16} />
                Cash on Delivery available
              </p>
              <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
                Clear QR tag pricing with privacy included.
              </h1>
              <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">
                Choose a NoNumQR sticker or tag for your first use case. Every package keeps the QR public and the owner phone number hidden by default.
              </p>
              <Link className="focus-ring mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]" href="/buy">
                Buy QR Tag <ArrowRight aria-hidden size={18} />
              </Link>
            </div>
            <div className="premium-card p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Privacy", body: "Phone hidden by default", Icon: ShieldCheck },
                  { title: "Delivery", body: "COD order flow", Icon: Truck },
                  { title: "Owner app", body: "Manage tags and replies", Icon: LockKeyhole }
                ].map(({ title, body, Icon }) => (
                  <div key={title} className="rounded-card border border-[var(--color-border)] bg-[var(--color-page-bg)] p-4">
                    <Icon aria-hidden className="text-[var(--color-primary)]" size={24} />
                    <h2 className="mt-4 font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <PricingSection />

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
            <article className="premium-card p-6">
              <SectionIntro eyebrow="Included privacy features" title="Every tag includes the same privacy foundation." />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {privacyFeatures.map((feature) => (
                  <div key={feature} className="flex gap-3 rounded-card border border-[var(--color-border)] bg-white p-4">
                    <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary-accent)]" />
                    <span className="font-semibold leading-6 text-[var(--color-ink)]">{feature}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="premium-card border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] p-6">
              <Truck aria-hidden className="text-[var(--color-warning)]" size={30} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Cash on Delivery is the working payment method.</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                NoNumQR currently uses COD for public orders. Online payments should not be treated as production-ready until they are explicitly launched and verified.
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-card bg-white p-4 text-sm font-semibold text-[var(--color-muted)]">
                <CreditCard aria-hidden className="text-[var(--color-info)]" size={18} />
                Online payment availability will be announced only after production readiness.
              </div>
            </article>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {[
              ["Order", "Choose quantity and delivery details through the public checkout."],
              ["Prepare", "Admin confirms, prints, and assigns the QR tag."],
              ["Use", "Sign in to the owner app and manage private requests."]
            ].map(([title, body]) => (
              <article key={title} className="premium-card p-6">
                <PackageCheck aria-hidden className="text-[var(--color-primary)]" size={24} />
                <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                <p className="mt-3 leading-7 text-[var(--color-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <FinalCTA />
      </main>
    </PublicLayout>
  );
}
