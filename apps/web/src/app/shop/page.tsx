import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, QrCode, ShoppingBag, Truck } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";
import { formatBdt, publicProducts } from "@/lib/publicCatalog";

export const metadata: Metadata = {
  title: "Shop QR Tags - NoNumQR",
  description: "Shop NoNumQR private QR tags and QR stickers."
};

export default function ShopPage() {
  const previewProducts = publicProducts.slice(0, 4);

  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="privacy-badge px-3 py-2 text-sm font-bold">
              <ShoppingBag aria-hidden size={16} />
              Simple shop bridge
            </p>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
              Shop private QR tags from the Buy page.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              No phone number is printed or encoded. Cash on Delivery is available for NoNumQR QR stickers and tags.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/buy" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]">
                Browse QR Tags <ArrowRight aria-hidden size={18} />
              </Link>
              <Link href="/how-it-works" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft border border-[var(--color-border-strong)] bg-white px-6 py-3 font-bold text-[var(--color-ink)] shadow-soft transition hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]">
                See how it works
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <SectionIntro eyebrow="Product preview" title="A quick look at popular NoNumQR tags." />
          <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4">
            {previewProducts.map((product) => (
              <Link key={product.slug} href={`/product/${product.slug}`} className="premium-card soft-hover flex h-full flex-col p-5">
                <div className="grid h-12 w-12 place-items-center rounded-card bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <QrCode aria-hidden size={24} />
                </div>
                <h2 className="mt-5 font-extrabold text-[var(--color-ink-strong)]">{product.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{product.bestUseCase}</p>
                <p className="mt-auto pt-5 text-sm font-bold text-[var(--color-primary)]">{formatBdt(product.priceBdt)}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {[
              { title: "No phone number printed or encoded.", Icon: LockKeyhole },
              { title: "QR contains only a public URL.", Icon: QrCode },
              { title: "Cash on Delivery available.", Icon: Truck }
            ].map(({ title, Icon }) => (
              <article key={title} className="premium-card p-6">
                <Icon aria-hidden className="text-[var(--color-primary)]" size={25} />
                <p className="mt-4 font-extrabold leading-7 text-[var(--color-ink-strong)]">{title}</p>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-4xl rounded-hero bg-[var(--color-ink-strong)] p-8 text-center text-white shadow-lift">
            <Check aria-hidden className="mx-auto text-[var(--color-primary-accent)]" size={28} />
            <h2 className="mt-4 text-2xl font-extrabold">Ready to choose?</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-200">The full product catalog and Buy Now links live on the Buy page.</p>
            <Link href="/buy" className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-soft bg-[var(--color-primary-accent)] px-6 py-3 font-bold text-white transition hover:bg-[var(--color-primary)]">
              Browse QR Tags <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
