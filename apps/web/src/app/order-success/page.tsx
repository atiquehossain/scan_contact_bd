import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { OrderSuccessClient } from "@/components/public/PublicShopClients";

export const metadata: Metadata = {
  title: "Order Placed - NoNumQR",
  description: "Your NoNumQR QR tag order has been placed. Download the owner app and sign in with the same phone number."
};

export default function OrderSuccessPage() {
  return (
    <PublicLayout>
      <main className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<div className="premium-card p-8 text-center font-bold text-[var(--color-muted)]">Loading order...</div>}>
            <OrderSuccessClient />
          </Suspense>
        </div>
      </main>
    </PublicLayout>
  );
}
