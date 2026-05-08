import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bike,
  BriefcaseBusiness,
  Building2,
  Car,
  Check,
  KeyRound,
  LockKeyhole,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Store,
  TimerReset
} from "lucide-react";
import { APP_NAME } from "@/lib/api";
import { BRAND_PROMISE } from "@/lib/brand";
import { faqItems, formatBdt, publicProducts, type PublicProduct } from "@/lib/publicCatalog";
import { SectionIntro } from "./PublicLayout";

const trustItems = ["Phone hidden", "Private chat", "QR URL only", "No scanner login", "COD available"];

export function HeroSection() {
  return (
    <section className="overflow-hidden bg-[radial-gradient(circle_at_20%_0%,#dbeafe_0,transparent_35%),radial-gradient(circle_at_85%_10%,#ccfbf1_0,transparent_30%),#f8fafc]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-2 text-sm font-black text-emerald-700 shadow-sm">
            <ShieldCheck aria-hidden size={16} className="shrink-0" /> <span className="min-w-0 leading-5">{BRAND_PROMISE}</span>
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
            Private QR contact without exposing phone numbers.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {APP_NAME} helps people reach vehicle owners, businesses, and item owners through secure QR-based messages and calls. Anyone can scan and contact privately while phone numbers stay hidden.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800" href="/buy">
              Buy QR Tag <ArrowRight aria-hidden size={18} />
            </Link>
            <Link className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 font-black text-slate-900 hover:bg-slate-50" href="/how-it-works">
              See How It Works
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {trustItems.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
                <Check aria-hidden size={15} className="text-emerald-600" /> {item}
              </span>
            ))}
          </div>
        </div>
        <InteractiveHeroVisual />
      </div>
    </section>
  );
}

export function InteractiveHeroVisual() {
  return (
    <div className="hero-visual relative mx-auto min-h-[420px] w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/55 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur">
      <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,rgba(37,99,235,0.08),rgba(16,185,129,0.12))]" />
      <div className="hero-phone absolute right-4 top-10 w-56 rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-2xl">
        <div className="rounded-[1.45rem] bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-500">
            <ScanLine size={15} /> Scanning QR tag
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-black text-emerald-700">Private request</p>
            <p className="mt-2 text-sm font-bold text-slate-900">Your car is blocking the gate.</p>
          </div>
          <div className="mt-4 rounded-2xl bg-emerald-700 p-3 text-sm font-bold text-white">Owner app reply: Thanks, I am moving it now.</div>
        </div>
      </div>
      <div className="hero-card absolute left-5 top-16 w-64 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Car QR Sticker</p>
            <p className="mt-1 font-black text-slate-950">Private contact</p>
          </div>
          <LockKeyhole className="text-emerald-600" size={24} />
        </div>
        <div className="mt-5 grid aspect-square grid-cols-5 gap-1 rounded-2xl bg-slate-950 p-3" aria-label="Decorative QR sticker visual">
          {Array.from({ length: 25 }).map((_, index) => (
            <span key={index} className={`rounded-sm ${[0, 1, 2, 5, 10, 12, 14, 18, 20, 21, 24].includes(index) ? "bg-white" : "bg-emerald-300"}`} />
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">QR contains only a public URL. No phone number inside.</p>
      </div>
      <div className="hero-bubble absolute bottom-10 left-16 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-900 shadow-lg">
        No scanner login needed
      </div>
    </div>
  );
}

export function ProblemSolutionSections() {
  const problems = [
    ["Public phone number", "Anyone can save, spam, or misuse it."],
    ["No privacy", "Your personal number becomes visible to strangers."],
    ["No control", "Calls and SMS do not give you a safe private chat system."],
    ["No history", "You cannot manage contact requests properly."]
  ];
  const steps = [
    ["Buy QR Tag", "Choose a QR sticker for car, bike, parking, shop, lost item, or business."],
    ["Activate with your phone", "Sign up safely using your Bangladesh phone number and OTP."],
    ["Receive private messages", "Scanners message you through browser. You reply from the owner app."]
  ];
  return (
    <>
      <section className="px-4 py-16">
        <SectionIntro title="Still putting your phone number on your car or shop?" body="A public number works, but it also gives strangers direct access to your personal contact channel." />
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-4">
          {problems.map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-slate-950 px-4 py-16 text-white">
        <SectionIntro eyebrow="Solution" title="One QR. Private messages. Full control." body="Your QR tag opens a safe contact page. Scanners send a message, and you reply from the owner app." />
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
          {steps.map(([title, body], index) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 font-black text-slate-950">{index + 1}</span>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{body}</p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-center font-bold text-emerald-100">
          Your QR does not contain your phone number, owner ID, address, or private data.
        </p>
      </section>
    </>
  );
}

export function ProductCategories() {
  const icons = [Car, Bike, KeyRound, BriefcaseBusiness, Building2, Store];
  return (
    <section className="px-4 py-16">
      <SectionIntro eyebrow="QR tags" title="Choose a QR tag for real Bangladesh use cases." body="Start with one sticker, or buy multiple tags for your vehicle, bag, shop, and parking space." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {publicProducts.map((product, index) => {
          const Icon = icons[index] || PackageCheck;
          return (
            <Link key={product.slug} href={`/product/${product.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <Icon className="text-emerald-700" size={30} />
              <h3 className="mt-5 text-xl font-black text-slate-950">{product.name}</h3>
              <p className="mt-2 leading-7 text-slate-600">{product.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-emerald-700">
                View details <ArrowRight aria-hidden size={16} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function PricingSection() {
  const cards = [
    ["Starter", "BDT 199", ["1 QR sticker", "Private contact page", "Owner app access", "Scanner private message", "COD available"]],
    ["Popular", "BDT 349", ["2 QR stickers", "Car + backup sticker", "Owner app access", "Private scanner chat", "Recommended"], "Recommended"],
    ["Family / Multi Tag", "BDT 599", ["4 QR stickers", "For car, bike, bag, and parking", "All tags under one owner account"]],
    ["Society / Business", "Custom", ["Bulk QR tags", "Admin support", "Parking/contact management"]]
  ];
  return (
    <section className="bg-white px-4 py-16">
      <SectionIntro eyebrow="Pricing" title="Simple packages. Cash on Delivery first." body="Start small, then add more QR tags under the same owner account." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 lg:grid-cols-4">
        {cards.map(([name, price, features, badge]) => (
          <article key={String(name)} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
            {badge ? <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{String(badge)}</span> : null}
            <h3 className="text-lg font-black">{name}</h3>
            <p className="mt-3 text-3xl font-black text-slate-950">{price}</p>
            <ul className="mt-5 grid gap-3 text-sm text-slate-700">
              {(features as string[]).map((item) => (
                <li key={item} className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 text-emerald-600" />{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DemoChatSection() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Live demo</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">See the private contact flow in seconds.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">Demo only. Real scanner conversations use a private continuation link.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 font-black"><ScanLine size={18} /> Scanner side</div>
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900">Reason: Vehicle is blocking</p>
            <p className="mt-3 rounded-2xl bg-slate-100 p-4 text-sm font-bold">Your car is blocking the gate.</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 font-black"><Smartphone size={18} /> Owner app side</div>
            <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm font-bold">New private request received</p>
            <p className="mt-3 rounded-2xl bg-emerald-400 p-4 text-sm font-black text-slate-950">Thanks, I am moving it now.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function PrivacyPromiseSection() {
  const items = [
    { title: "QR contains only public URL", Icon: ShieldCheck },
    { title: "Phone number hidden by default", Icon: LockKeyhole },
    { title: "Scanner does not need login", Icon: ScanLine },
    { title: "Private conversation link required", Icon: KeyRound },
    { title: "Chat expires after inactivity", Icon: TimerReset },
    { title: "Old chats are anonymized after retention", Icon: Bell }
  ];
  return (
    <section className="bg-emerald-50 px-4 py-16">
      <SectionIntro eyebrow="Privacy promise" title="Built so your number stays yours." body="ScanContact BD is designed around private messages, explicit owner control, and minimal public exposure." />
      <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ title, Icon }) => (
          <article key={title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <Icon className="text-emerald-700" size={24} />
            <h3 className="mt-4 font-black">{title}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AppSection() {
  const screens = ["Home", "Tags", "Requests", "Chat", "Alerts", "Account"];
  return (
    <section className="px-4 py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Owner app</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Owners reply from the mobile app.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">The web panel stays admin-only. QR owners use the owner app for tags, requests, private chats, alerts, and account actions.</p>
          <Link href="/download-app" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">
            Download Owner App <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {screens.map((screen) => (
            <div key={screen} className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <Smartphone className="mx-auto text-emerald-700" />
              <p className="mt-3 font-black">{screen}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQSection({ compact = false }: { compact?: boolean }) {
  const items = compact ? faqItems.slice(0, 5) : faqItems;
  return (
    <section className="bg-white px-4 py-16">
      <SectionIntro eyebrow="FAQ" title="Questions people ask before buying." />
      <div className="mx-auto mt-10 grid max-w-4xl gap-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <summary className="cursor-pointer text-base font-black text-slate-950">{item.question}</summary>
            <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
          </details>
        ))}
      </div>
      {compact ? (
        <div className="mt-8 text-center">
          <Link href="/faq" className="font-black text-emerald-700">Read all FAQs</Link>
        </div>
      ) : null}
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-slate-950 p-8 text-center text-white md:p-12">
        <h2 className="text-3xl font-black md:text-5xl">Protect your number today.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">Buy a ScanContact BD QR tag and let people contact you privately.</p>
        <Link href="/buy" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white hover:bg-emerald-800">
          Buy QR Tag <ArrowRight aria-hidden size={18} />
        </Link>
      </div>
    </section>
  );
}

export function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">{product.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{product.bestUseCase}</p>
        </div>
        <p className="shrink-0 rounded-2xl bg-emerald-50 px-3 py-2 text-lg font-black text-emerald-700">{formatBdt(product.priceBdt)}</p>
      </div>
      <p className="mt-4 leading-7 text-slate-600">{product.description}</p>
      <ul className="mt-5 grid gap-2 text-sm text-slate-700">
        {product.features.map((feature) => (
          <li key={feature} className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 text-emerald-600" />{feature}</li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
        <Link className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 font-black text-white" href={`/checkout?product=${product.slug}`}>
          Buy Now
        </Link>
        <Link className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 font-black text-slate-900" href={`/product/${product.slug}`}>
          Details
        </Link>
      </div>
    </article>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function ProductJsonLd({ product, appUrl }: { product: PublicProduct; appUrl: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.seoDescription,
        brand: { "@type": "Brand", name: APP_NAME },
        offers:
          product.priceBdt === "Custom"
            ? undefined
            : {
                "@type": "Offer",
                priceCurrency: "BDT",
                price: product.priceBdt,
                availability: "https://schema.org/InStock",
                url: `${appUrl.replace(/\/$/, "")}/product/${product.slug}`
              }
      }}
    />
  );
}

export function FAQJsonLd({ items = faqItems }: { items?: typeof faqItems }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer }
        }))
      }}
    />
  );
}
