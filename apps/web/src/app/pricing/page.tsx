import type { Metadata } from "next";
import { PublicLayout } from "@/components/public/PublicLayout";
import { FinalCTA, PricingSection } from "@/components/public/PublicSections";

export const metadata: Metadata = {
  title: "Pricing - ScanContact BD QR Tags",
  description: "Simple QR tag and QR sticker pricing for ScanContact BD with Cash on Delivery support."
};

export default function PricingPage() {
  return (
    <PublicLayout>
      <main>
        <PricingSection />
        <FinalCTA />
      </main>
    </PublicLayout>
  );
}
