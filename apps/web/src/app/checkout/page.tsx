import type { Metadata } from "next";
import { Suspense } from "react";
import { CreditCard, LockKeyhole, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { CheckoutClient } from "@/components/public/PublicShopClients";

export const metadata: Metadata = {
  title: "Checkout - Buy NoNumQR QR Tag",
  description: "Place a Cash on Delivery order for a private NoNumQR QR tag or QR sticker."
};

export default function CheckoutPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="privacy-badge px-3 py-2 text-sm font-bold">
                <Truck aria-hidden size={16} />
                Cash on Delivery available
              </p>
              <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
                Place your NoNumQR order securely.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
                Cash on Delivery is the working payment method. Your QR tag will be assigned after order processing.
              </p>
            </div>
            <div className="premium-card p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Details", Icon: PackageCheck },
                  { title: "COD", Icon: CreditCard },
                  { title: "Privacy", Icon: LockKeyhole }
                ].map(({ title, Icon }, index) => (
                  <div key={title} className="rounded-card border border-[var(--color-border)] bg-white p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-soft bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <Icon aria-hidden size={20} />
                    </span>
                    <p className="mt-3 text-sm font-bold text-[var(--color-muted)]">Step {index + 1}</p>
                    <h2 className="mt-1 font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                  </div>
                ))}
              </div>
              <p className="mt-5 flex gap-2 rounded-card bg-[var(--color-secondary-soft)] p-4 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                We never print or encode your phone number inside the QR code.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<div className="premium-card p-8 text-center font-bold text-[var(--color-muted)]">Loading checkout...</div>}>
              <CheckoutClient />
            </Suspense>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
