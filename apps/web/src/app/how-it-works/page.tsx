import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, CircleOff, KeyRound, Link2, LockKeyhole, MessageSquareText, ScanLine, ShieldCheck, Smartphone, TimerReset } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "How NoNumQR Works - Private QR Contact",
  description: "Learn how NoNumQR QR tags let people message car, bike, shop, parking, and lost item owners without seeing phone numbers."
};

const scannerFlow = [
  { title: "Scan the sticker", body: "A scanner opens the public NoNumQR web page from the QR tag.", Icon: ScanLine },
  { title: "Choose a reason", body: "They can explain a parking, lost item, shop, or urgent contact issue.", Icon: MessageSquareText },
  { title: "Send privately", body: "The message is sent without showing the owner's phone number.", Icon: LockKeyhole }
] satisfies Array<{ title: string; body: string; Icon: LucideIcon }>;

const ownerFlow = [
  { title: "Get the request", body: "The owner sees the private request in the owner app.", Icon: Smartphone },
  { title: "Reply in chat", body: "The scanner receives a token-protected continuation link.", Icon: KeyRound },
  { title: "Let it expire", body: "Inactive conversations become read-only after expiry.", Icon: TimerReset }
] satisfies Array<{ title: string; body: string; Icon: LucideIcon }>;

const notInsideQr = ["Phone number", "Owner name", "Address", "Owner ID", "Vehicle owner identity", "Private profile data"];

export default function HowItWorksPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="privacy-badge px-3 py-2 text-sm font-bold">
                <ShieldCheck aria-hidden size={16} />
                Your phone number stays private.
              </p>
              <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
                Private QR contact in four simple steps.
              </h1>
              <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">
                A NoNumQR tag lets someone reach you through a secure web page while your personal number stays hidden by default.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]" href="/buy">
                  Buy QR Tag <ArrowRight aria-hidden size={18} />
                </Link>
                <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft border border-[var(--color-border-strong)] bg-white px-6 py-3 font-bold text-[var(--color-ink)] shadow-soft transition hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]" href="/privacy">
                  Read privacy promise
                </Link>
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["1", "Place your NoNumQR sticker/tag"],
                  ["2", "Someone scans the QR"],
                  ["3", "They send a private message"],
                  ["4", "You reply without revealing your number"]
                ].map(([step, title]) => (
                  <div key={step} className="rounded-card border border-[var(--color-border)] bg-[var(--color-page-bg)] p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-soft bg-[var(--color-primary-soft)] font-extrabold text-[var(--color-primary)]">{step}</span>
                    <p className="mt-4 font-extrabold text-[var(--color-ink-strong)]">{title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <SectionIntro eyebrow="The flow" title="Scanner side and owner side stay clearly separated." body="The scanner gets a simple web form. The owner gets private requests and replies in the owner app." />
          <div className="mx-auto mt-10 grid max-w-7xl gap-5 lg:grid-cols-2">
            <FlowColumn title="Scanner flow" items={scannerFlow} />
            <FlowColumn title="Owner flow" items={ownerFlow} />
          </div>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <SectionIntro eyebrow="QR privacy" title="Only a public URL is inside the QR." body="The QR should be safe to print, stick, and scan because it does not encode private owner data." />
          <div className="mx-auto mt-10 grid max-w-7xl gap-5 lg:grid-cols-2">
            <article className="premium-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-card bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Link2 aria-hidden size={24} />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--color-ink-strong)]">What is inside the QR</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">A public URL such as /t/publicSlug.</p>
                </div>
              </div>
              <p className="mt-6 rounded-card bg-[var(--color-secondary-soft)] p-4 font-bold leading-7 text-[var(--color-ink-strong)]">
                Only a public URL is inside the QR. Your phone number stays private.
              </p>
            </article>
            <article className="premium-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-card bg-[var(--color-danger-bg)] text-[var(--color-danger)]">
                  <CircleOff aria-hidden size={24} />
                </span>
                <h2 className="text-xl font-extrabold text-[var(--color-ink-strong)]">What is not inside the QR</h2>
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {notInsideQr.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-soft bg-[var(--color-page-bg)] px-3 py-2 text-sm font-semibold text-[var(--color-muted)]">
                    <CircleOff aria-hidden className="text-[var(--color-danger)]" size={15} />
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
            {[
              ["Private chat", "After a message is sent, the scanner can continue from a token-protected conversation link."],
              ["Conversation expiry", "Inactive conversations expire and become read-only, so old links do not stay open forever."],
              ["Owner control", "Owners manage QR tags, private requests, alerts, and replies from the owner app."]
            ].map(([title, body]) => (
              <article key={title} className="premium-card p-6">
                <Check aria-hidden className="text-[var(--color-primary-accent)]" size={24} />
                <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                <p className="mt-3 leading-7 text-[var(--color-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function FlowColumn({ title, items }: { title: string; items: Array<{ title: string; body: string; Icon: LucideIcon }> }) {
  return (
    <article className="premium-card p-6">
      <h2 className="text-2xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
      <div className="mt-6 grid gap-4">
        {items.map(({ title: itemTitle, body, Icon }) => (
          <div key={itemTitle} className="flex gap-4 rounded-card border border-[var(--color-border)] bg-white p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-soft bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Icon aria-hidden size={21} />
            </span>
            <div>
              <h3 className="font-extrabold text-[var(--color-ink-strong)]">{itemTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
