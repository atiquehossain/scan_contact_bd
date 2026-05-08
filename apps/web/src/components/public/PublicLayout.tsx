import Link from "next/link";
import { ArrowRight, Menu, ShieldCheck } from "lucide-react";
import { APP_NAME } from "@/lib/api";

const nav = [
  ["How It Works", "/how-it-works"],
  ["Products", "/buy"],
  ["Pricing", "/pricing"],
  ["Privacy", "/privacy"],
  ["FAQ", "/faq"]
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3 font-black" aria-label={`${APP_NAME} home`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-emerald-300 shadow-sm">
            <ShieldCheck aria-hidden size={22} />
          </span>
          <span>{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 lg:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-slate-950">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:text-slate-950" href="/download-app">
            Download App
          </Link>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-emerald-800" href="/buy">
            Buy QR Tag <ArrowRight aria-hidden size={16} />
          </Link>
        </div>

        <details className="relative md:hidden">
          <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 bg-white" aria-label="Open menu">
            <Menu aria-hidden size={20} />
          </summary>
          <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <nav className="grid gap-1 text-sm font-bold text-slate-700">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className="rounded-xl px-3 py-3 hover:bg-slate-50">
                  {label}
                </Link>
              ))}
              <Link href="/download-app" className="rounded-xl px-3 py-3 hover:bg-slate-50">
                Download App
              </Link>
              <Link href="/buy" className="mt-2 rounded-xl bg-emerald-700 px-3 py-3 text-center text-white">
                Buy QR Tag
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
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 font-black">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-emerald-300">
              <ShieldCheck aria-hidden size={22} />
            </span>
            {APP_NAME}
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
            Private QR contact tags for cars, bikes, shops, parking, business cards, and lost items in Bangladesh.
          </p>
        </div>
        <FooterColumn title="Products" links={[["Car QR Sticker", "/product/car-qr-sticker"], ["Bike QR Sticker", "/product/bike-qr-sticker"], ["Lost Item QR Tag", "/product/lost-item-qr-tag"], ["Shop QR Sticker", "/product/shop-qr-contact-sticker"]]} />
        <FooterColumn title="Learn" links={[["How It Works", "/how-it-works"], ["Privacy", "/privacy"], ["FAQ", "/faq"], ["Download App", "/download-app"]]} />
        <FooterColumn title="Company" links={[["Contact", "/contact"], ["Terms", "/terms"], ["Shipping", "/shipping"], ["Admin Login", "/admin/login"]]} />
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">{title}</h2>
      <nav className="mt-3 grid gap-2 text-sm text-slate-600">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="hover:text-slate-950">
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
      {eyebrow ? <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-lg leading-8 text-slate-600">{body}</p> : null}
    </div>
  );
}
