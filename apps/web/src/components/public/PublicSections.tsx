import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  BriefcaseBusiness,
  Building2,
  Car,
  Check,
  KeyRound,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  PackageCheck,
  QrCode,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  TimerReset,
  Truck
} from "lucide-react";
import { BRAND_NAME, BRAND_PROMISE } from "@/lib/brand";
import { faqItems, formatBdt, publicProducts, type PublicProduct } from "@/lib/publicCatalog";
import { SectionIntro } from "./PublicLayout";

const trustBadges = [
  { label: "No phone number in QR", Icon: QrCode },
  { label: "Private scanner chat", Icon: MessageSquareText },
  { label: "Token-protected conversations", Icon: KeyRound },
  { label: "Built for Bangladesh", Icon: MapPin }
] satisfies Array<{ label: string; Icon: LucideIcon }>;

const howItWorks = [
  {
    title: "Place your NoNumQR sticker/tag",
    body: "Put the QR sticker on a car, bike, shop counter, parking space, bag, or item.",
    Icon: QrCode
  },
  {
    title: "Someone scans the QR",
    body: "The scanner opens a public web page with only the contact options you allow.",
    Icon: ScanLine
  },
  {
    title: "They send a private message",
    body: "Their message reaches you without exposing your phone number on the QR page.",
    Icon: MessageSquareText
  },
  {
    title: "You reply without revealing your number",
    body: "Continue the conversation from the owner app through a token-protected thread.",
    Icon: LockKeyhole
  }
] satisfies Array<{ title: string; body: string; Icon: LucideIcon }>;

const useCases = [
  { title: "Car parking", body: "Let people report blocked gates or urgent parking issues privately.", Icon: Car },
  { title: "Bike parking", body: "Give nearby people a quick contact path without writing your number.", Icon: Bike },
  { title: "Delivery rider", body: "Share a safer contact option while moving between deliveries.", Icon: Truck },
  { title: "Lost item", body: "Add a private return path to bags, keys, documents, or gear.", Icon: PackageCheck },
  { title: "Apartment parking", body: "Reduce friction for residents, guards, and visitors.", Icon: Building2 },
  { title: "Business contact", body: "Offer an easy web message option without a public personal number.", Icon: BriefcaseBusiness },
  { title: "Shop QR sticker", body: "Let customers reach the shop through a clean contact page.", Icon: Store }
] satisfies Array<{ title: string; body: string; Icon: LucideIcon }>;

const previewSlugs = ["car-qr-sticker", "bike-qr-sticker", "lost-item-qr-tag", "business-qr-card"] as const;
const previewNameBySlug: Record<(typeof previewSlugs)[number], string> = {
  "car-qr-sticker": "NoNumQR Car Sticker",
  "bike-qr-sticker": "NoNumQR Bike Sticker",
  "lost-item-qr-tag": "NoNumQR Lost Item Tag",
  "business-qr-card": "NoNumQR Business QR Card"
};

export function HeroSection() {
  return (
    <section className="soft-section-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="max-w-xl">
          <p className="privacy-badge px-3 py-2 text-sm font-bold">
            <ShieldCheck aria-hidden size={16} />
            No phone number in QR
          </p>

          <h1 className="landing-hero-title mt-6 max-w-xl">
            Let people contact you without revealing your number.
          </h1>
          <p className="page-hero-copy mt-5 max-w-xl">
            NoNumQR QR stickers and tags let scanners send private messages through a secure web page. Your phone number stays hidden by default.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]" href="/buy">
              Buy QR Tag <ArrowRight aria-hidden size={18} />
            </Link>
            <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft border border-[var(--color-border-strong)] bg-white/90 px-6 py-3 font-bold text-[var(--color-ink)] shadow-soft transition hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]" href="/how-it-works">
              See how it works
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {trustBadges.map(({ label, Icon }) => (
              <div key={label} className="flex items-center gap-2 rounded-soft border border-white/80 bg-white/82 px-3 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-soft backdrop-blur">
                <Icon aria-hidden className="text-[var(--color-primary-accent)]" size={17} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card relative overflow-hidden p-3">
          <div
            className="qr-shimmer min-h-[280px] rounded-card bg-cover bg-center md:min-h-[360px]"
            style={{ backgroundImage: "url('/images/nonumqr-premium-hero-products.png')" }}
            aria-label="Premium NoNumQR QR sticker, tag, and card"
          />
          <div className="absolute bottom-6 left-6 max-w-xs rounded-card border border-white/80 bg-white/95 p-4 shadow-soft backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-soft bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <MessageSquareText aria-hidden size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--color-ink-strong)]">Private message received</p>
                <p className="text-xs text-[var(--color-muted)]">Token-protected chat link</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-ink)]">
              The QR contains only a public URL.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function InteractiveHeroVisual() {
  return (
    <div className="premium-card qr-shimmer min-h-[280px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/nonumqr-premium-hero-products.png')" }} aria-label="Premium NoNumQR QR products" />
  );
}

export function ProblemSolutionSections() {
  return (
    <section className="bg-white px-4 py-16 md:px-6 md:py-20" id="how-it-works">
      <SectionIntro
        eyebrow="How it works"
        title="A private contact path in four simple steps."
        body="NoNumQR keeps the public QR simple while moving the conversation into a safer web flow."
      />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4">
        {howItWorks.map(({ title, body, Icon }, index) => (
          <article key={title} className="premium-card soft-hover p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-soft bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Icon aria-hidden size={22} />
              </span>
              <span className="text-sm font-bold text-[var(--color-muted)]">0{index + 1}</span>
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-[var(--color-ink-strong)]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
          </article>
        ))}
      </div>
      <div className="premium-card mx-auto mt-8 max-w-4xl border-[var(--color-primary-accent)]/25 bg-[var(--color-secondary-soft)] p-5 text-center">
        <p className="text-base font-bold leading-7 text-[var(--color-ink-strong)]">
          The QR contains only a public URL. Your phone number is hidden by default.
        </p>
      </div>
    </section>
  );
}

export function ProductCategories() {
  const products = previewSlugs
    .map((slug) => publicProducts.find((product) => product.slug === slug))
    .filter((product): product is PublicProduct => Boolean(product));

  return (
    <>
      <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
        <SectionIntro
          eyebrow="Use cases"
          title="Built for everyday contact moments."
          body="Use NoNumQR anywhere a public phone number would feel too exposed."
        />
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map(({ title, body, Icon }) => (
            <article key={title} className="premium-card soft-hover p-5">
              <Icon aria-hidden className="text-[var(--color-primary)]" size={24} />
              <h3 className="mt-4 font-extrabold text-[var(--color-ink-strong)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-16 md:px-6 md:py-20">
        <SectionIntro
          eyebrow="Product preview"
          title="Private QR products for the real world."
          body="Start with the tag that fits your first use case, then add more under the same owner account."
        />
        <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.slug} href={`/product/${product.slug}`} className="premium-card soft-hover group flex h-full flex-col p-6">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-card bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <ShoppingBag aria-hidden size={23} />
              </div>
              <h3 className="text-lg font-extrabold text-[var(--color-ink-strong)]">{previewNameBySlug[product.slug as (typeof previewSlugs)[number]]}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{product.bestUseCase}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                <span className="rounded-full bg-[var(--color-page-bg)] px-3 py-1 text-sm font-bold text-[var(--color-primary)]">{formatBdt(product.priceBdt)}</span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-primary)]">
                  Details <ArrowRight aria-hidden size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export function PricingSection() {
  const cards = [
    {
      name: "Starter",
      price: "BDT 199",
      features: ["1 QR sticker", "Private contact page", "Owner app access", "Scanner private message", "Cash on Delivery available."]
    },
    {
      name: "Popular",
      price: "BDT 349",
      badge: "Recommended",
      features: ["2 QR stickers", "Car + backup sticker", "Owner app access", "Private scanner chat", "COD support"]
    },
    {
      name: "Family / Multi Tag",
      price: "BDT 599",
      features: ["4 QR stickers", "For car, bike, bag, and parking", "All tags under one owner account"]
    },
    {
      name: "Society / Business",
      price: "Custom",
      features: ["Bulk QR tags", "Admin support", "Parking/contact management"]
    }
  ];

  return (
    <section className="bg-white px-4 py-16 md:px-6 md:py-20" id="pricing">
      <SectionIntro eyebrow="Pricing" title="Simple packages. Cash on Delivery available." body="Start small, then add more QR tags under the same owner account." />
      <div className="mx-auto mt-10 grid max-w-7xl gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.name} className={`premium-card relative p-6 ${card.badge ? "border-[var(--color-primary-accent)]/35" : ""}`}>
            {card.badge ? <span className="absolute right-4 top-4 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{card.badge}</span> : null}
            <h3 className="text-lg font-extrabold text-[var(--color-ink-strong)]">{card.name}</h3>
            <p className="mt-3 text-3xl font-extrabold text-[var(--color-ink-strong)]">{card.price}</p>
            <ul className="mt-5 grid gap-3 text-sm text-[var(--color-muted)]">
              {card.features.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-accent)]" />
                  {item}
                </li>
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
    <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-sm font-bold text-[var(--color-primary)]">Private scanner chat</p>
          <h2 className="section-title mt-3">A calmer way to handle urgent contact.</h2>
          <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
            Scanners can send a private message from the browser. Owners reply from the owner app through a protected conversation link.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="premium-card p-5">
            <div className="flex items-center gap-2 font-extrabold text-[var(--color-ink-strong)]">
              <ScanLine aria-hidden size={18} /> Scanner side
            </div>
            <p className="mt-4 rounded-card bg-[var(--color-warning-bg)] p-4 text-sm font-semibold text-[var(--color-warning-text)]">Reason: Vehicle is blocking</p>
            <p className="mt-3 rounded-card bg-[var(--color-page-bg)] p-4 text-sm font-semibold text-[var(--color-ink)]">Your car is blocking the gate.</p>
          </article>
          <article className="rounded-card border border-[var(--color-ink-strong)] bg-[var(--color-ink-strong)] p-5 text-white shadow-soft">
            <div className="flex items-center gap-2 font-extrabold">
              <Smartphone aria-hidden size={18} /> Owner app side
            </div>
            <p className="mt-4 rounded-card bg-white/10 p-4 text-sm font-semibold">New private request received</p>
            <p className="mt-3 rounded-card bg-[var(--color-primary-accent)] p-4 text-sm font-extrabold text-white">Thanks, I am moving it now.</p>
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
    { title: "Minimal public profile exposure", Icon: BadgeCheck }
  ] satisfies Array<{ title: string; Icon: LucideIcon }>;

  return (
    <section className="bg-white px-4 py-16 md:px-6 md:py-20" id="privacy">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-bold text-[var(--color-primary)]">Privacy-first</p>
          <h2 className="section-title mt-3">Designed so your number stays yours.</h2>
          <p className="mt-4 text-lg font-semibold leading-8 text-[var(--color-ink)]">
            The QR contains only a public URL. Your phone number is hidden by default.
          </p>
          <p className="mt-3 text-base leading-7 text-[var(--color-muted)]">
            NoNumQR keeps private owner details out of the public QR and uses token-protected conversations for scanner follow-up.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ title, Icon }) => (
            <article key={title} className="premium-card p-5">
              <Icon aria-hidden className="text-[var(--color-primary)]" size={24} />
              <h3 className="mt-4 font-extrabold text-[var(--color-ink-strong)]">{title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AppSection() {
  const features = ["QR tags", "Private requests", "Alerts", "Orders", "Replies"];

  return (
    <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-bold text-[var(--color-primary)]">Owner app</p>
          <h2 className="section-title mt-3">Owners manage private contact from the app.</h2>
          <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
            Owners can manage QR tags, private requests, alerts, orders, and replies from the owner app.
          </p>
          <Link href="/download-app" className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-soft bg-[var(--color-ink-strong)] px-6 py-3 font-bold text-white transition hover:bg-slate-700">
            Download Owner App <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
        <div className="premium-card p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-card border border-[var(--color-border)] bg-white p-5 text-center">
                <Smartphone className="mx-auto text-[var(--color-primary)]" aria-hidden />
                <p className="mt-3 font-extrabold text-[var(--color-ink-strong)]">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FAQSection({ compact = false }: { compact?: boolean }) {
  const items = compact ? faqItems.slice(0, 5) : faqItems;
  return (
    <section className="bg-white px-4 py-16 md:px-6 md:py-20" id="faq">
      <SectionIntro eyebrow="FAQ" title="Short answers before you buy." body={compact ? "The essentials about privacy, QR tags, owner replies, and delivery." : undefined} />
      <div className="mx-auto mt-10 grid max-w-4xl gap-3">
        {items.map((item) => (
          <details key={item.question} className="premium-card group p-5">
            <summary className="cursor-pointer list-none text-base font-extrabold text-[var(--color-ink-strong)]">
              <span className="inline-flex w-full items-center justify-between gap-4">
                {item.question}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-page-bg)] text-[var(--color-primary)] transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 leading-7 text-[var(--color-muted)]">{item.answer}</p>
          </details>
        ))}
      </div>
      {compact ? (
        <div className="mt-8 text-center">
          <Link href="/faq" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-soft border border-[var(--color-border)] bg-white px-5 py-2 font-bold text-[var(--color-primary)] shadow-soft transition hover:border-[var(--color-primary-accent)]">
            Read all FAQs
          </Link>
        </div>
      ) : null}
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-5xl rounded-hero bg-[var(--color-ink-strong)] p-8 text-center text-white shadow-lift md:p-12">
        <p className="text-sm font-bold text-[var(--color-primary-soft)]">{BRAND_PROMISE}</p>
        <h2 className="section-title mt-3 text-white">Protect your number before the next scan.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-200">Buy a NoNumQR QR tag and give people a private way to reach you.</p>
        <Link href="/buy" className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-soft bg-[var(--color-primary-accent)] px-6 py-3 font-bold text-white transition hover:bg-[var(--color-primary)]">
          Buy QR Tag <ArrowRight aria-hidden size={18} />
        </Link>
      </div>
    </section>
  );
}

export function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="premium-card flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-ink-strong)]">{product.name}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{product.bestUseCase}</p>
        </div>
        <p className="shrink-0 rounded-full bg-[var(--color-primary-soft)] px-3 py-2 text-sm font-extrabold text-[var(--color-primary)]">{formatBdt(product.priceBdt)}</p>
      </div>
      <p className="mt-4 leading-7 text-[var(--color-muted)]">{product.description}</p>
      <ul className="mt-5 grid gap-2 text-sm text-[var(--color-muted)]">
        {product.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-accent)]" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
        <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-soft bg-[var(--color-primary)] px-4 py-2 font-bold text-white" href={`/checkout?product=${product.slug}`}>
          Buy Now
        </Link>
        <Link className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-soft border border-[var(--color-border-strong)] px-4 py-2 font-bold text-[var(--color-ink)]" href={`/product/${product.slug}`}>
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
        brand: { "@type": "Brand", name: BRAND_NAME },
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
