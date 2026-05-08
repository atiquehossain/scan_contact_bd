import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare, PackageCheck, ScanLine, Smartphone } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "How ScanContact BD Works - Private QR Contact",
  description: "Learn how ScanContact BD QR tags let people message car, bike, shop, parking, and lost item owners without seeing phone numbers."
};

const steps = [
  { title: "Buy QR Tag", body: "Choose a QR sticker for car, bike, parking, shop, lost item, or business.", Icon: PackageCheck },
  { title: "Place or activate it", body: "Use the owner phone number for order and OTP activation.", Icon: ScanLine },
  { title: "Scanner sends message", body: "Anyone scans the QR and sends a private browser message.", Icon: MessageSquare },
  { title: "Owner replies in app", body: "The owner receives the request and replies privately from the owner app.", Icon: Smartphone }
];

export default function HowItWorksPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro
          eyebrow="How it works"
          title="Private QR contact in four simple steps."
          body="The scanner never needs an app. The owner replies from the mobile app. The QR contains only a public URL."
        />
        <section className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-4">
          {steps.map(({ title, body, Icon }, index) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 font-black text-emerald-700">{index + 1}</span>
              <Icon className="mt-5 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </section>
        <section className="mx-auto mt-10 max-w-4xl rounded-3xl bg-slate-950 p-8 text-white">
          <h2 className="text-2xl font-black">Important privacy rule</h2>
          <p className="mt-3 leading-8 text-slate-300">Your QR code contains only a public URL like /t/publicSlug. It does not contain owner phone, owner name, owner ID, vehicle owner identity, address, or private data.</p>
          <Link href="/buy" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white">
            Buy QR Tag <ArrowRight aria-hidden size={18} />
          </Link>
        </section>
      </main>
    </PublicLayout>
  );
}
