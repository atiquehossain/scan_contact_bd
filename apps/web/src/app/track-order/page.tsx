import type { Metadata } from "next";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";
import { TrackOrderClient } from "@/components/public/PublicShopClients";

export const metadata: Metadata = {
  title: "Track QR Tag Order - ScanContact BD",
  description: "Track a ScanContact BD QR tag order using the public order tracking code."
};

export default function TrackOrderPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro eyebrow="Track order" title="Check your QR tag order status." body="Enter the order tracking code from your order confirmation." />
        <section className="mt-10">
          <TrackOrderClient />
        </section>
      </main>
    </PublicLayout>
  );
}
