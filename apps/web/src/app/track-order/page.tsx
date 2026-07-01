import type { Metadata } from "next";
import { PackageSearch, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { TrackOrderClient } from "@/components/public/PublicShopClients";

export const metadata: Metadata = {
  title: "Track QR Tag Order - NoNumQR",
  description: "Track a NoNumQR QR tag order using the public order tracking code."
};

export default function TrackOrderPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="privacy-badge px-3 py-2 text-sm font-bold">
              <PackageSearch aria-hidden size={16} />
              Order tracking
            </p>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
              Check your QR tag order status.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Enter the tracking code from your order confirmation. Cash on Delivery status appears with your order details.
            </p>
            <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--color-muted)] shadow-soft">
              <ShieldCheck aria-hidden size={16} className="text-[var(--color-primary)]" />
              QR codes contain only public NoNumQR URLs.
            </p>
          </div>
        </section>
        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <TrackOrderClient />
        </section>
      </main>
    </PublicLayout>
  );
}
