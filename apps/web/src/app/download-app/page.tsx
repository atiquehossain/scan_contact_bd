import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bell, LayoutDashboard, LockKeyhole, MessageSquareReply, PackageCheck, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Download Owner App - NoNumQR",
  description: "Download or install the NoNumQR owner app to receive QR tag messages and reply privately."
};

const appFeatures = [
  { title: "Dashboard", body: "See active tags, recent private requests, and important alerts.", Icon: LayoutDashboard },
  { title: "My QR Tags", body: "Manage assigned QR stickers and labels from one owner account.", Icon: QrCode },
  { title: "Private requests", body: "Review scanner messages without exposing your phone number publicly.", Icon: LockKeyhole },
  { title: "Chat replies", body: "Reply to token-protected conversations from the owner app.", Icon: MessageSquareReply },
  { title: "Alerts", body: "Notice urgent contact requests and QR tag activity.", Icon: Bell },
  { title: "Orders", body: "Track QR tag orders and assigned products when available.", Icon: PackageCheck }
] satisfies Array<{ title: string; body: string; Icon: LucideIcon }>;

export default function DownloadAppPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="privacy-badge px-3 py-2 text-sm font-bold">
                <Smartphone aria-hidden size={16} />
                NoNumQR Owner app
              </p>
              <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
                Manage QR tags and private requests from your phone.
              </h1>
              <p className="mt-6 text-lg leading-8 text-[var(--color-muted)]">
                Owners can manage QR tags, private requests, alerts, orders, and replies from the owner app after buying or receiving an assigned NoNumQR tag.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button className="min-h-12 cursor-not-allowed rounded-soft bg-[var(--color-ink-strong)] px-5 py-3 text-left font-bold text-white opacity-80" disabled>
                  Android download coming soon
                </button>
                <button className="min-h-12 cursor-not-allowed rounded-soft border border-[var(--color-border-strong)] bg-white px-5 py-3 text-left font-bold text-[var(--color-muted)]" disabled>
                  App Store placeholder
                </button>
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="mx-auto max-w-sm rounded-[2rem] border border-[var(--color-ink-strong)] bg-[var(--color-ink-strong)] p-3 shadow-lift">
                <div className="rounded-[1.5rem] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-primary)]">Owner dashboard</p>
                      <h2 className="mt-1 text-xl font-extrabold text-[var(--color-ink-strong)]">3 new requests</h2>
                    </div>
                    <ShieldCheck aria-hidden className="text-[var(--color-primary)]" size={28} />
                  </div>
                  <div className="mt-6 grid gap-3">
                    {["Car QR Sticker", "Private chat reply", "COD order update"].map((item) => (
                      <div key={item} className="rounded-card bg-[var(--color-page-bg)] p-4">
                        <p className="font-bold text-[var(--color-ink)]">{item}</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">Owner-only preview</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <SectionIntro eyebrow="Owner app features" title="Everything owners need after the QR tag is assigned." />
          <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appFeatures.map(({ title, body, Icon }) => (
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
              <h2 className="text-2xl font-extrabold text-[var(--color-ink-strong)]">How owner activation works</h2>
              <ol className="mt-6 grid gap-4">
                {["Buy a QR sticker using your phone number.", "Admin prints and assigns the QR tag.", "Open the owner app and request OTP.", "Sign in with the same phone number.", "Your assigned QR tags and private messages appear in the app."].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-extrabold text-[var(--color-primary)]">{index + 1}</span>
                    <span className="leading-7 text-[var(--color-muted)]">{step}</span>
                  </li>
                ))}
              </ol>
            </article>
            <article className="premium-card border-[var(--color-primary-accent)]/25 bg-[var(--color-secondary-soft)] p-6">
              <ShieldCheck aria-hidden className="text-[var(--color-primary)]" size={30} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Privacy-first reassurance</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                The owner app is where owners manage private requests and replies. Public QR pages should not reveal owner phone numbers or private profile data.
              </p>
              <Link href="/buy" className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]">
                Buy QR Tag <ArrowRight aria-hidden size={18} />
              </Link>
            </article>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
