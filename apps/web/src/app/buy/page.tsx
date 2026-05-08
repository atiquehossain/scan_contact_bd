import type { Metadata } from "next";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";
import { BuyProductsClient } from "@/components/public/PublicShopClients";

export const metadata: Metadata = {
  title: "Buy QR Tag - ScanContact BD",
  description: "Choose a private QR sticker or QR tag for car, bike, parking, shop, business, or lost items in Bangladesh."
};

export default function BuyPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro
          eyebrow="Buy QR tag"
          title="Choose the QR tag that fits your need."
          body="All products use private QR contact. Your QR contains only a public URL, and your phone stays hidden from scanners by default."
        />
        <section className="mx-auto mt-10 max-w-7xl">
          <BuyProductsClient />
        </section>
      </main>
    </PublicLayout>
  );
}
