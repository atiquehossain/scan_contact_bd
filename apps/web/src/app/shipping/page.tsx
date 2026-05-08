import type { Metadata } from "next";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Shipping - ScanContact BD",
  description: "Shipping and Cash on Delivery information for ScanContact BD QR tag and QR sticker orders."
};

export default function ShippingPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro eyebrow="Shipping" title="QR sticker delivery with COD support." body="For MVP launch, orders are created as Cash on Delivery and processed manually from the admin panel." />
        <section className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            ["Order created", "You place a COD order with phone and delivery address."],
            ["Admin processes", "Admin confirms, prints, and prepares the QR tag."],
            ["Assign and deliver", "After assignment, the QR appears in the owner app."]
          ].map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </PublicLayout>
  );
}
