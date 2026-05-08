import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Shop QR Tags - ScanContact BD",
  description: "Shop ScanContact BD private QR tags and QR stickers."
};

export default function ShopPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro eyebrow="Shop" title="QR tag shop has moved to Buy." body="Choose your ScanContact BD QR sticker from the Buy page." />
        <div className="mt-8 text-center">
          <Link href="/buy" className="inline-flex min-h-12 items-center rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white">
            Go to Buy QR Tag
          </Link>
        </div>
      </main>
    </PublicLayout>
  );
}
