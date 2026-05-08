import type { Metadata } from "next";
import { KeyRound, LockKeyhole, ScanLine, ShieldCheck, TimerReset, Trash2 } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Privacy - ScanContact BD",
  description: "How ScanContact BD keeps phone numbers hidden with private QR contact links, protected chats, expiry, and retention."
};

const promises = [
  { title: "QR contains only public URL", body: "No phone number, owner ID, address, or private data is encoded in the QR.", Icon: ScanLine },
  { title: "Phone hidden by default", body: "Scanners send private messages instead of seeing your personal number.", Icon: LockKeyhole },
  { title: "Protected private chat", body: "Scanner conversation continuation requires the private link created after scanning the QR.", Icon: KeyRound },
  { title: "No scanner login", body: "The scanner can send a message from browser without creating an account.", Icon: ShieldCheck },
  { title: "30-minute inactivity expiry", body: "Chats expire after inactivity, and old links stop working.", Icon: TimerReset },
  { title: "Retention cleanup", body: "Expired conversations are retained briefly for owner review, then anonymized.", Icon: Trash2 }
];

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <main className="px-4 py-14">
        <SectionIntro
          eyebrow="Privacy"
          title="Your phone number stays hidden from scanners."
          body="ScanContact BD is designed for private contact, not public lookup. Scanners can message you, but the QR does not reveal your personal details."
        />
        <section className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promises.map(({ title, body, Icon }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </PublicLayout>
  );
}
