import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BadgeCheck, ClipboardCheck, PackageCheck, Printer, ShieldCheck, Truck } from "lucide-react";
import { PublicLayout, SectionIntro } from "@/components/public/PublicLayout";

export const metadata: Metadata = {
  title: "Shipping - NoNumQR",
  description: "Shipping and Cash on Delivery information for NoNumQR QR tag and QR sticker orders."
};

const deliverySteps = [
  { title: "Order confirmation", body: "You place a Cash on Delivery order with your phone number and delivery details.", Icon: ClipboardCheck },
  { title: "QR printing and assignment", body: "The operator confirms, prints, and assigns the QR tag to the intended owner account.", Icon: Printer },
  { title: "Delivery tracking", body: "Use your tracking code to check order status as the tag moves through processing.", Icon: PackageCheck },
  { title: "COD delivery", body: "Payment is collected at delivery according to the confirmed COD order details.", Icon: Truck }
] satisfies Array<{ title: string; body: string; Icon: LucideIcon }>;

export default function ShippingPage() {
  return (
    <PublicLayout>
      <main>
        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="privacy-badge px-3 py-2 text-sm font-bold">
              <Truck aria-hidden size={16} />
              COD delivery process
            </p>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink-strong)] md:text-6xl">
              QR sticker delivery with Cash on Delivery.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              NoNumQR public orders are handled through a Cash on Delivery flow while QR printing, assignment, and delivery are processed by the operator.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/track-order" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]">
                Track Order <ArrowRight aria-hidden size={18} />
              </Link>
              <Link href="/contact" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft border border-[var(--color-border-strong)] bg-white px-6 py-3 font-bold text-[var(--color-ink)] shadow-soft transition hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]">
                Contact Support
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6 md:py-20">
          <SectionIntro eyebrow="Delivery steps" title="From COD order to assigned QR tag." />
          <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4">
            {deliverySteps.map(({ title, body, Icon }, index) => (
              <article key={title} className="premium-card soft-hover p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-soft bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Icon aria-hidden size={22} />
                  </span>
                  <span className="text-sm font-bold text-[var(--color-muted)]">0{index + 1}</span>
                </div>
                <h2 className="mt-5 text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
                <p className="mt-3 leading-7 text-[var(--color-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="soft-section-bg px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <article className="premium-card border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] p-6">
              <BadgeCheck aria-hidden className="text-[var(--color-warning)]" size={28} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">COD expectation</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                Cash on Delivery is the working payment method for NoNumQR public orders. Online payments should not be treated as production-ready unless explicitly launched later.
              </p>
            </article>
            <article className="premium-card p-6">
              <ShieldCheck aria-hidden className="text-[var(--color-primary)]" size={28} />
              <h2 className="mt-4 text-2xl font-extrabold text-[var(--color-ink-strong)]">Privacy after delivery</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                Once assigned, the QR tag should open only a public NoNumQR URL. It should not encode phone numbers, addresses, owner IDs, or private owner profile data.
              </p>
            </article>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
