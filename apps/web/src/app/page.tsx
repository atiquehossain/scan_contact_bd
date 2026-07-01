import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
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
  title: "NoNumQR - Contact without revealing your number",
  description:
    "Private QR contact for cars, bikes, homes, shops, and lost items. Let people message you after scanning your QR without seeing your phone number.",
  alternates: { canonical: appUrl },
  openGraph: {
    title: "NoNumQR - Contact without revealing your number",
    description:
      "Buy a private QR contact sticker in Bangladesh. Let people message you after scanning your QR without seeing your phone number.",
    url: appUrl,
    siteName: BRAND_NAME,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "NoNumQR - Contact without revealing your number",
    description: "Private QR contact for cars, bikes, homes, shops, and lost items."
  }
};

export default function HomePage() {
  return (
    <PublicLayout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: BRAND_NAME,
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
