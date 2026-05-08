import type { Metadata } from "next";
import { APP_NAME } from "@/lib/api";
import { PublicLayout } from "@/components/public/PublicLayout";
import {
  AppSection,
  DemoChatSection,
  FAQJsonLd,
  FAQSection,
  FinalCTA,
  HeroSection,
  JsonLd,
  PricingSection,
  PrivacyPromiseSection,
  ProblemSolutionSections,
  ProductCategories
} from "@/components/public/PublicSections";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "ScanContact BD - Private QR Sticker for Car, Bike, Parking & Lost Items",
  description:
    "Buy a private QR contact sticker in Bangladesh. Let people message you after scanning your QR without seeing your phone number. Perfect for cars, bikes, parking, shops, and lost items.",
  alternates: { canonical: appUrl },
  openGraph: {
    title: "ScanContact BD - Private QR Sticker for Car, Bike, Parking & Lost Items",
    description:
      "Buy a private QR contact sticker in Bangladesh. Let people message you after scanning your QR without seeing your phone number.",
    url: appUrl,
    siteName: APP_NAME,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ScanContact BD - Private QR Sticker for Bangladesh",
    description: "Private QR contact stickers for cars, bikes, parking, shops, and lost items."
  }
};

export default function HomePage() {
  return (
    <PublicLayout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: APP_NAME,
          url: appUrl,
          description: "Bangladesh-first private QR contact tag platform."
        }}
      />
      <FAQJsonLd />
      <HeroSection />
      <ProblemSolutionSections />
      <ProductCategories />
      <PricingSection />
      <DemoChatSection />
      <PrivacyPromiseSection />
      <AppSection />
      <FAQSection compact />
      <FinalCTA />
    </PublicLayout>
  );
}
