import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Ban, Flag, KeyRound, Link2, LockKeyhole, ScanLine, ShieldCheck, TimerReset, Trash2 } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Privacy - NoNumQR",
  description: "How NoNumQR keeps phone numbers hidden with private QR contact links, protected chats, expiry, and retention."
};

const privacyPromises = [
  { title: "Only a public URL is inside the QR", body: "The printed QR points to a NoNumQR public URL such as /t/publicSlug.", Icon: Link2 },
  { title: "Your phone number stays private", body: "Scanners send private messages instead of seeing your personal number by default.", Icon: LockKeyhole },
  { title: "Token-protected conversations", body: "Follow-up chat requires the private continuation link created after a scan.", Icon: KeyRound },
  { title: "Conversation expiry", body: "Inactive conversations expire and become read-only so old links do not remain open.", Icon: TimerReset },
  { title: "Abuse reporting", body: "Public scan flows include a path to report misuse or suspicious contact attempts.", Icon: Flag },
  { title: "Retention cleanup", body: "Expired conversations are retained briefly for owner review, then anonymized.", Icon: Trash2 }
] satisfies Array<{ title: string; body: string; Icon: LucideIcon }>;

const notPublic = ["Phone number", "Owner name", "Address", "Owner ID", "Vehicle owner identity", "Private profile data"];

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="privacy-badge px-3 py-2 text-sm font-bold">
                <ShieldCheck aria-hidden size={16} />
                Contact without revealing your number.
              </p>
              <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
                Privacy is the product, not a footnote.
              </h1>
              <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">
                NoNumQR is designed for private contact, not public lookup. Scanners can message you, but public QR pages should not expose private owner details.
              </p>
            </div>
            <article className="premium-card border-[var(--color-primary-accent)]/25 bg-white p-6">
              <ScanLine aria-hidden className="text-[var(--color-primary)]" size={30} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Only a public URL is inside the QR.</h2>
              <p className="mt-3 text-lg font-semibold leading-8 text-[var(--color-ink)]">Your phone number stays private.</p>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                The QR does not encode a phone number, owner ID, address, owner identity, or private profile data.
              </p>
            </article>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <SectionIntro eyebrow="Privacy promise" title="Clear privacy boundaries on every public scan." />
          <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {privacyPromises.map(({ title, body, Icon }) => (
              <article key={title} className="premium-card soft-hover p-6">
                <Icon aria-hidden className="text-[var(--color-primary)]" size={26} />
                <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                <p className="mt-3 leading-7 text-[var(--color-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <article className="premium-card p-6">
              <h2 className="text-2xl font-extrabold text-[var(--color-ink-strong)]">What is not inside the QR</h2>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {notPublic.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-soft bg-[var(--color-danger-bg)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)]">
                    <Ban aria-hidden className="text-[var(--color-danger)]" size={15} />
                    {item}
                  </div>
                ))}
              </div>
            </article>
            <article className="premium-card p-6">
              <h2 className="text-2xl font-extrabold text-[var(--color-ink-strong)]">How scanner follow-up works</h2>
              <p className="mt-4 leading-7 text-[var(--color-muted)]">
                After a scanner sends a message, NoNumQR can provide a private continuation link for that conversation. The link is token-protected, expires after inactivity, and does not reveal the owner phone number.
              </p>
              <p className="mt-4 rounded-card bg-[var(--color-info-soft)] p-4 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                Abuse reports help operators review misuse without turning public QR pages into owner profile pages.
              </p>
            </article>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-5xl rounded-hero bg-[var(--color-ink-strong)] p-8 text-center text-white shadow-lift md:p-12">
            <h2 className="section-title text-white">Want the practical version?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-200">
              See how a QR scan becomes a private message without putting your phone number in the code.
            </p>
            <Link href="/how-it-works" className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-soft bg-[var(--color-primary-accent)] px-6 py-3 font-bold text-white transition hover:bg-[var(--color-primary)]">
              See how it works <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
