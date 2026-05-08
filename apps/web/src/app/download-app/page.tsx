import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone, ShieldCheck } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Download Owner App - ScanContact BD",
  description: "Download or install the ScanContact BD owner app to receive QR tag messages and reply privately."
};

export default function DownloadAppPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro
          eyebrow="Owner app"
          title="Use the owner app after buying your QR tag."
          body="Owners do not use the public website for chat. Sign in to the app with the same phone number used for your QR order or assignment."
        />
        <section className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Smartphone className="text-emerald-700" size={34} />
            <h2 className="mt-4 text-2xl font-black">Android owner app</h2>
            <p className="mt-3 leading-7 text-slate-600">Install the local Android build during testing. A public Play Store link can be added when the app is released.</p>
            <button className="mt-6 min-h-12 rounded-2xl bg-slate-300 px-5 py-3 font-black text-slate-700" disabled>
              Android download coming soon
            </button>
          </article>
          <article className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <ShieldCheck className="text-emerald-700" size={34} />
            <h2 className="mt-4 text-2xl font-black">How owner activation works</h2>
            <ol className="mt-4 grid gap-3 font-bold text-emerald-950">
              <li>1. Buy a QR sticker using your phone number.</li>
              <li>2. Admin prints and assigns the QR tag.</li>
              <li>3. Open the owner app and request OTP.</li>
              <li>4. Sign in with the same phone number.</li>
              <li>5. Your assigned QR tags and private messages appear in the app.</li>
            </ol>
            <Link href="/buy" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white">
              Buy QR Tag
            </Link>
          </article>
        </section>
      </main>
    </PublicLayout>
  );
}
