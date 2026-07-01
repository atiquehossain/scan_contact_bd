import Link from "next/link";
import { ArrowRight, Menu, QrCode, ShieldCheck } from "lucide-react";
import { BRAND_NAME, BRAND_PROMISE, BRAND_TAGLINE } from "@/lib/brand";

const nav = [
  ["How it works", "/how-it-works"],
  ["Pricing", "/pricing"],
  ["Buy", "/buy"],
  ["FAQ", "/faq"],
  ["Privacy", "/privacy"],
  ["Contact", "/contact"]
] satisfies Array<[string, string]>;

const footerLinks = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Shipping", "/shipping"],
  ["Contact", "/contact"],
  ["FAQ", "/faq"]
] satisfies Array<[string, string]>;

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell min-h-screen bg-[var(--color-page-bg)] text-[var(--color-ink)]">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/70 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 md:px-6">
        <Link href="/" className="focus-ring group flex items-center gap-2.5 rounded-card" aria-label={`${BRAND_NAME} home`}>
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold text-[var(--color-ink-strong)]">{BRAND_NAME}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-semibold text-[var(--color-muted)] lg:flex" aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="focus-ring rounded-full px-3 py-2 transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)]">
              {label}
            </Link>
          ))}
        </nav>

        <Link
          className="focus-ring hidden min-h-10 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)] md:inline-flex"
          href="/buy"
        >
          Buy QR Tag <ArrowRight aria-hidden size={16} />
        </Link>

        <details className="group relative lg:hidden">
          <summary className="focus-ring grid h-11 w-11 cursor-pointer list-none place-items-center rounded-soft border border-[var(--color-border)] bg-white text-[var(--color-ink)] shadow-soft" aria-label="Open navigation menu">
            <Menu aria-hidden size={20} />
          </summary>
          <div className="premium-card absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] p-3">
            <nav className="grid gap-1 text-sm font-semibold text-[var(--color-ink)]" aria-label="Mobile navigation">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className="focus-ring rounded-soft px-3 py-3 transition hover:bg-[var(--color-surface-soft)]">
                  {label}
                </Link>
              ))}
              <Link href="/buy" className="focus-ring mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-4 py-3 font-bold text-white">
                Buy QR Tag <ArrowRight aria-hidden size={16} />
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr] md:px-6 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 font-extrabold text-[var(--color-ink-strong)]">
            <BrandMark compact />
            {BRAND_NAME}
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--color-muted)]">{BRAND_TAGLINE}</p>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-[var(--color-ink)]">{BRAND_PROMISE}</p>
        </div>

        <FooterColumn title="Company" links={footerLinks} />
        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-page-bg)] p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
            <ShieldCheck aria-hidden size={17} />
            Privacy-first by design
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            QR tags open a public contact page. The QR itself does not contain your phone number or private profile data.
          </p>
        </div>
      </div>
    </footer>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-card bg-[var(--color-primary)] text-white shadow-soft ${
        compact ? "h-8 w-8" : "h-9 w-9"
      }`}
      aria-hidden="true"
    >
      <ShieldCheck size={compact ? 17 : 19} />
      <QrCode className="absolute -bottom-1 -right-1 text-white/45" size={compact ? 14 : 16} />
    </span>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h2 className="text-sm font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
      <nav className="mt-3 grid gap-2 text-sm text-[var(--color-muted)]" aria-label={title}>
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="focus-ring rounded-soft py-1 transition hover:text-[var(--color-primary)]">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function SectionIntro({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="text-sm font-bold text-[var(--color-primary)]">{eyebrow}</p> : null}
      <h2 className="section-title mt-3">{title}</h2>
      {body ? <p className="section-copy mt-4">{body}</p> : null}
    </div>
  );
}
