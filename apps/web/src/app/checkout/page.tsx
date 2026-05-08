import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";
import { CheckoutClient } from "@/components/public/PublicShopClients";

export const metadata: Metadata = {
  title: "Checkout - Buy ScanContact BD QR Tag",
  description: "Place a Cash on Delivery order for a private ScanContact BD QR tag or QR sticker."
};

export default function CheckoutPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro
          eyebrow="Checkout"
          title="Place your QR tag order."
          body="Cash on Delivery is supported first. Your phone is used for delivery and owner app signup only. It is not exposed on your QR tag."
        />
        <section className="mx-auto mt-10 max-w-7xl">
          <Suspense fallback={<div className="rounded-3xl bg-white p-8 text-center font-bold">Loading checkout...</div>}>
            <CheckoutClient />
          </Suspense>
        </section>
      </main>
    </PublicLayout>
  );
}
