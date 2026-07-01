import type { Metadata } from "next";
import { BadgeCheck, KeyRound, LockKeyhole, QrCode, ShieldCheck, Smartphone, Truck } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";
import { BuyProductsClient } from "@/components/public/PublicShopClients";

export const metadata: Metadata = {
  title: "Buy QR Tag - NoNumQR",
  description: "Choose a private QR sticker or QR tag for car, bike, parking, shop, business, or lost items in Bangladesh."
};

const trustItems = [
  { label: "Private by default", Icon: LockKeyhole },
  { label: "COD available", Icon: Truck },
  { label: "QR contains only public URL", Icon: QrCode },
  { label: "Owner app supported", Icon: Smartphone }
];

export default function BuyPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="privacy-badge px-3 py-2 text-sm font-bold">
                <ShieldCheck aria-hidden size={16} />
                No phone number printed or encoded
              </p>
              <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
                Choose the NoNumQR tag that fits your need.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
                Choose a private QR sticker or tag. Your phone number is not printed or encoded.
              </p>
            </div>
            <div className="premium-card p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {trustItems.map(({ label, Icon }) => (
                  <div key={label} className="rounded-card border border-[var(--color-border)] bg-white p-4">
                    <Icon aria-hidden className="text-[var(--color-primary)]" size={24} />
                    <p className="mt-3 font-extrabold text-[var(--color-ink-strong)]">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-card bg-[var(--color-secondary-soft)] p-4 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                Every NoNumQR product opens a public contact page and keeps private owner details out of the printed QR.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <SectionIntro
            eyebrow="Product catalog"
            title="Private QR products for cars, bikes, homes, shops, and lost items."
            body="Pick a product, review the details, then continue to Cash on Delivery checkout."
          />
          <div className="mx-auto mt-8 flex max-w-7xl flex-wrap justify-center gap-3">
            {["Vehicle", "Lost item", "Business", "Apartment", "Shop"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-page-bg)] px-4 py-2 text-sm font-bold text-[var(--color-muted)]">
                <BadgeCheck aria-hidden size={15} className="text-[var(--color-primary-accent)]" />
                {item}
              </span>
            ))}
          </div>
          <section className="mx-auto mt-10 max-w-7xl" aria-label="NoNumQR products">
            <BuyProductsClient />
          </section>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {[
              ["Public URL only", "This QR contains only a public URL such as /t/publicSlug."],
              ["Private scanner chat", "Scanners send messages through the NoNumQR web page."],
              ["Token-protected follow-up", "Conversation continuation uses a private tokenized link."]
            ].map(([title, body]) => (
              <article key={title} className="premium-card p-6">
                <KeyRound aria-hidden className="text-[var(--color-primary)]" size={24} />
                <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                <p className="mt-3 leading-7 text-[var(--color-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
