import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { FAQJsonLd, ProductJsonLd } from "@/components/public/PublicSections";
import { formatBdt, productBySlug, publicProducts } from "@/lib/publicCatalog";

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

  return (
    <PublicLayout>
      <ProductJsonLd product={product} appUrl={appUrl} />
      <FAQJsonLd items={product.faq} />
      <main>
        <section className="bg-white px-4 py-14">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_420px]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Private QR contact product</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">{product.name}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{product.seoDescription}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white" href={`/checkout?product=${product.slug}`}>
                  Buy Now <ArrowRight aria-hidden size={18} />
                </Link>
                <Link className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 font-black" href="/how-it-works">
                  How It Works
                </Link>
              </div>
            </div>
            <aside className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black">Package</h2>
                <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-2xl font-black text-emerald-700">{formatBdt(product.priceBdt)}</p>
              </div>
              <p className="mt-4 leading-7 text-slate-600">{product.bestUseCase}</p>
              <ul className="mt-6 grid gap-3 text-sm font-bold text-slate-700">
                {product.included.map((item) => (
                  <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />{item}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
            <InfoCard title="Use case" body={product.bestUseCase} />
            <InfoCard title="How it works" body="Buy the QR tag, sign in to the owner app with the same phone number, and receive private scanner messages after assignment." />
            <InfoCard title="Privacy details" body="The QR contains only a public URL. It does not contain your phone number, owner ID, address, or private data." />
          </div>
        </section>

        <section className="bg-emerald-50 px-4 py-14">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-700" />
              <h2 className="text-3xl font-black">Privacy-first by default</h2>
            </div>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {product.features.map((feature) => (
                <li key={feature} className="rounded-2xl bg-white p-4 font-bold text-slate-700"><Check className="mr-2 inline h-4 w-4 text-emerald-600" />{feature}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-black">Product FAQ</h2>
            <div className="mt-6 grid gap-3">
              {product.faq.map((item) => (
                <details key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <summary className="cursor-pointer font-black">{item.question}</summary>
                  <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
            <Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 font-black text-white" href={`/checkout?product=${product.slug}`}>
              Buy {product.shortName} QR Tag <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{body}</p>
    </article>
  );
}
