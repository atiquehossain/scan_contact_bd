import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Contact - ScanContact BD",
  description: "Contact ScanContact BD for QR tag orders, reseller questions, and society or business bulk QR sticker support."
};

export default function ContactPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro eyebrow="Contact" title="Need help with QR tags?" body="For launch, order and support handling can be managed from the admin panel and owner app." />
        <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Support options</h2>
          <p className="mt-3 leading-7 text-slate-600">Use the checkout flow for individual QR tag orders. For apartment, shop, society, reseller, or bulk QR sticker support, contact the ScanContact BD operator through your configured support phone or email.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/buy" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white">Buy QR Tag</Link>
            <Link href="/track-order" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 font-black">Track Order</Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
