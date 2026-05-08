import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { OrderSuccessClient } from "@/components/public/PublicShopClients";

export const metadata: Metadata = {
  title: "Order Placed - ScanContact BD",
  description: "Your ScanContact BD QR tag order has been placed. Download the owner app and sign in with the same phone number."
};

export default function OrderSuccessPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <Suspense fallback={<div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center font-bold">Loading order...</div>}>
          <OrderSuccessClient />
        </Suspense>
      </main>
    </PublicLayout>
  );
}
