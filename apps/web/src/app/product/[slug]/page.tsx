import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bike,
  BriefcaseBusiness,
  Building2,
  Car,
  Check,
  KeyRound,
  Link2,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck
} from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { FAQJsonLd, ProductJsonLd } from "@/components/public/PublicSections";
import { formatBdt, productBySlug, publicProducts, type PublicProduct } from "@/lib/publicCatalog";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function generateStaticParams() {
  return publicProducts.map((product) => ({ slug: product.slug }));
}

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle,
    description: product.seoDescription,
    alternates: { canonical: `${appUrl.replace(/\/$/, "")}/product/${product.slug}` },
    openGraph: {
      title: product.seoTitle,
      description: product.seoDescription,
      url: `${appUrl.replace(/\/$/, "")}/product/${product.slug}`,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle,
      description: product.seoDescription
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const relatedProducts = publicProducts.filter((item) => item.slug !== product.slug).slice(0, 3);
  const useCases = productUseCases(product);

  return (
    <PublicLayout>
      <ProductJsonLd product={product} appUrl={appUrl} />
      <FAQJsonLd items={product.faq} />
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <Link href="/buy" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-bold text-[var(--color-primary)]">
                <ArrowLeft aria-hidden size={16} />
                Back to products
              </Link>
              <p className="privacy-badge mt-6 px-3 py-2 text-sm font-bold">
                <ShieldCheck aria-hidden size={16} />
                No phone number printed or encoded
              </p>
              <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">{product.name}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">{product.seoDescription}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-soft)] px-3 py-2 text-sm font-bold text-[var(--color-primary)]">
                  <BadgeCheck aria-hidden size={15} />
                  Standard QR tag
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-warning-bg)] px-3 py-2 text-sm font-bold text-[var(--color-warning-text)]">
                  <Truck aria-hidden size={15} />
                  Cash on Delivery available
                </span>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]" href={`/checkout?product=${product.slug}`}>
                  Buy Now <ArrowRight aria-hidden size={18} />
                </Link>
                <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft border border-[var(--color-border-strong)] bg-white px-6 py-3 font-bold text-[var(--color-ink)] shadow-soft transition hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]" href="/how-it-works">
                  How it works
                </Link>
              </div>
            </div>
            <aside className="premium-card overflow-hidden">
              <ProductVisual product={product} />
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-extrabold text-[var(--color-ink-strong)]">Package</h2>
                  <p className="rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-2xl font-extrabold text-[var(--color-primary)]">{formatBdt(product.priceBdt)}</p>
                </div>
                <p className="mt-4 leading-7 text-[var(--color-muted)]">{product.bestUseCase}</p>
                <ul className="mt-6 grid gap-3 text-sm font-semibold text-[var(--color-muted)]">
                  {product.included.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
            <InfoCard title="Privacy promise" body="This QR contains only a public URL. Your phone number is not printed or encoded." Icon={LockKeyhole} />
            <InfoCard title="How it is used" body="Place the tag, let someone scan it, and receive private requests through NoNumQR." Icon={Link2} />
            <InfoCard title="After order" body="The operator confirms, prints, assigns, and delivers the QR tag through the COD flow." Icon={PackageCheck} />
          </div>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold text-[var(--color-primary)]">Benefits</p>
              <h2 className="section-title mt-3">What this product helps with.</h2>
              <p className="section-copy mt-4">{product.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.features.map((feature) => (
                <div key={feature} className="premium-card p-4">
                  <Check aria-hidden className="text-[var(--color-primary-accent)]" size={20} />
                  <p className="mt-3 font-semibold leading-6 text-[var(--color-ink)]">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <article className="premium-card p-6">
              <h2 className="text-xl font-bold text-[var(--color-ink-strong)]">Use case examples</h2>
              <div className="mt-6 grid gap-3">
                {useCases.map((item) => (
                  <div key={item} className="rounded-card border border-[var(--color-border)] bg-[var(--color-page-bg)] p-4 font-semibold leading-6 text-[var(--color-muted)]">
                    {item}
                  </div>
                ))}
              </div>
            </article>
            <article className="premium-card border-[var(--color-primary-accent)]/25 bg-[var(--color-secondary-soft)] p-6">
              <KeyRound aria-hidden className="text-[var(--color-primary)]" size={30} />
              <h2 className="mt-4 text-xl font-bold text-[var(--color-ink-strong)]">What happens after order</h2>
              <ol className="mt-5 grid gap-3">
                {["Place the Cash on Delivery order.", "Admin confirms, prints, and assigns your QR tag.", "Sign in to the owner app with the same phone number.", "Start receiving private scanner requests after assignment."].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-sm font-extrabold text-[var(--color-primary)]">{index + 1}</span>
                    <span className="leading-7 text-[var(--color-muted)]">{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="section-title">Product FAQ</h2>
            <div className="mt-6 grid gap-3">
              {product.faq.map((item) => (
                <details key={item.question} className="premium-card group p-5">
                  <summary className="cursor-pointer list-none font-extrabold text-[var(--color-ink-strong)]">
                    <span className="inline-flex w-full items-center justify-between gap-4">
                      {item.question}
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-page-bg)] text-[var(--color-primary)] transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 leading-7 text-[var(--color-muted)]">{item.answer}</p>
                </details>
              ))}
            </div>
            <Link className="focus-ring mt-8 inline-flex min-h-12 items-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]" href={`/checkout?product=${product.slug}`}>
              Buy {product.shortName} QR Tag <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-bold text-[var(--color-primary)]">Related products</p>
                <h2 className="section-title mt-3">More private QR options</h2>
              </div>
              <Link href="/buy" className="focus-ring inline-flex items-center gap-2 font-bold text-[var(--color-primary)]">
                View all products <ArrowRight aria-hidden size={16} />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {relatedProducts.map((item) => (
                <Link key={item.slug} href={`/product/${item.slug}`} className="premium-card soft-hover p-5">
                  <p className="font-extrabold text-[var(--color-ink-strong)]">{item.name}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.bestUseCase}</p>
                  <p className="mt-4 text-sm font-bold text-[var(--color-primary)]">{formatBdt(item.priceBdt)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function InfoCard({ title, body, Icon }: { title: string; body: string; Icon: LucideIcon }) {
  return (
    <article className="premium-card p-6">
      <Icon aria-hidden className="text-[var(--color-primary)]" size={26} />
      <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
      <p className="mt-3 leading-7 text-[var(--color-muted)]">{body}</p>
    </article>
  );
}

function ProductVisual({ product }: { product: PublicProduct }) {
  return (
    <div className="product-material-surface relative min-h-80 overflow-hidden p-6">
      <div className="absolute right-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--color-primary)] shadow-soft">{product.shortName}</div>
      <div
        className="min-h-72 rounded-hero bg-cover bg-center shadow-soft"
        style={{ backgroundImage: "url('/images/nonumqr-premium-product-set.png')" }}
        aria-hidden="true"
      />
      <div className="absolute left-8 top-8 grid h-14 w-14 place-items-center rounded-card bg-white/90 text-[var(--color-primary)] shadow-soft">
        <ProductIcon product={product} size={30} />
      </div>
      <div className="qr-shimmer absolute bottom-8 left-8 grid h-20 w-20 grid-cols-5 gap-1 rounded-card bg-[var(--color-ink-strong)] p-2" aria-hidden="true">
        {Array.from({ length: 25 }).map((_, index) => (
          <span key={index} className={`rounded-[2px] ${[0, 1, 2, 5, 10, 12, 14, 18, 20, 21, 24].includes(index) ? "bg-white" : "bg-[var(--color-primary-accent)]"}`} />
        ))}
      </div>
      <div className="absolute bottom-8 right-8 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-[var(--color-ink)] shadow-soft">
        <LockKeyhole aria-hidden size={14} className="text-[var(--color-primary)]" />
        Public URL only
      </div>
    </div>
  );
}

function ProductIcon({ product, size }: { product: PublicProduct; size: number }) {
  if (product.slug.includes("bike")) return <Bike aria-hidden className="text-[var(--color-primary)]" size={size} />;
  if (product.slug.includes("business")) return <BriefcaseBusiness aria-hidden className="text-[var(--color-primary)]" size={size} />;
  if (product.slug.includes("apartment") || product.slug.includes("parking")) return <Building2 aria-hidden className="text-[var(--color-primary)]" size={size} />;
  if (product.slug.includes("shop")) return <Store aria-hidden className="text-[var(--color-primary)]" size={size} />;
  if (product.slug.includes("lost")) return <PackageCheck aria-hidden className="text-[var(--color-primary)]" size={size} />;
  return <Car aria-hidden className="text-[var(--color-primary)]" size={size} />;
}

function productUseCases(product: PublicProduct) {
  if (product.slug.includes("bike")) return ["Motorbike parking contact", "Delivery rider contact", "Office or apartment bike parking"];
  if (product.slug.includes("lost")) return ["Bags and backpacks", "Keys, wallets, and documents", "Laptops or office equipment"];
  if (product.slug.includes("business")) return ["Freelancer inquiry card", "Small service provider contact", "Private business lead capture"];
  if (product.slug.includes("apartment") || product.slug.includes("parking")) return ["Apartment parking", "Office parking", "Guard-assisted visitor contact"];
  if (product.slug.includes("shop")) return ["Shop counter contact", "Repair/service desk", "Customer inquiry sticker"];
  return ["Car parking gate issues", "Apartment garage contact", "Office or visitor parking"];
}
