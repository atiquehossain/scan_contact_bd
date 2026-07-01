import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, HelpCircle, MessageSquareText, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { FAQJsonLd, FAQSection } from "@/components/public/PublicSections";

export const metadata: Metadata = {
  title: "FAQ - NoNumQR QR Tags",
  description: "Questions and answers about NoNumQR private QR tags, QR stickers, owner app, scanner messages, COD, and privacy."
};

export default function FAQPage() {
  return (
    <PublicLayout>
      <FAQJsonLd />
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="privacy-badge px-3 py-2 text-sm font-bold">
              <HelpCircle aria-hidden size={16} />
              Buyer and scanner questions
            </p>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
              Practical answers before you scan or buy.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              The short version: QR codes contain a public URL, phone numbers stay hidden by default, chats are protected, and Cash on Delivery is the working payment method.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              { title: "Privacy", body: "Phone hidden by default", Icon: ShieldCheck },
              { title: "Chat", body: "Token-protected continuation", Icon: MessageSquareText },
              { title: "Payment", body: "COD available", Icon: CreditCard }
            ].map(({ title, body, Icon }) => (
              <article key={title} className="premium-card p-5 text-center">
                <Icon aria-hidden className="mx-auto text-[var(--color-primary)]" size={26} />
                <h2 className="mt-4 font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <FAQSection />

        <section className="px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-5 rounded-hero bg-[var(--color-ink-strong)] p-8 text-white shadow-lift md:flex-row md:items-center md:p-10">
            <div>
              <h2 className="text-2xl font-extrabold">Still deciding which QR tag fits?</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-200">Start with the product catalog, then choose the tag that matches your car, bike, lost item, shop, or business use case.</p>
            </div>
            <Link href="/buy" className="focus-ring inline-flex min-h-12 shrink-0 items-center gap-2 rounded-soft bg-[var(--color-primary-accent)] px-6 py-3 font-bold text-white transition hover:bg-[var(--color-primary)]">
              Buy QR Tag <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
