import type { Metadata } from "next";
import { PublicLayout } from "@/components/public/PublicLayout";
import { FAQJsonLd, FAQSection } from "@/components/public/PublicSections";

export const metadata: Metadata = {
  title: "FAQ - ScanContact BD QR Tags",
  description: "Questions and answers about ScanContact BD private QR tags, QR stickers, owner app, scanner messages, COD, and privacy."
};

export default function FAQPage() {
  return (
    <PublicLayout>
      <FAQJsonLd />
      <main>
        <FAQSection />
      </main>
    </PublicLayout>
  );
}
