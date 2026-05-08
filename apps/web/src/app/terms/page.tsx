import type { Metadata } from "next";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Terms - ScanContact BD",
  description: "Basic terms for using ScanContact BD QR tags, private contact pages, owner app, and COD order flow."
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro eyebrow="Terms" title="Use ScanContact BD responsibly." body="These MVP terms explain the intended safe use of QR tags and private contact messages." />
        <article className="mx-auto mt-10 max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 leading-8 text-slate-700 shadow-sm">
          <p>ScanContact BD is for legitimate private contact such as parking, lost-and-found, shop, business, and society communication. Do not use it for harassment, stalking, illegal lookup, impersonation, spam, or exposing private data.</p>
          <p className="mt-4">QR tags contain public ScanContact URLs only. Owners control their private contact settings. Scanners should avoid sending sensitive information unless needed.</p>
          <p className="mt-4">Before a commercial launch, verify current Bangladesh telecom, payment, privacy, e-commerce, tax, and consumer-protection requirements from official sources.</p>
        </article>
      </main>
    </PublicLayout>
  );
}
