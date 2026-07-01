"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bike,
  BriefcaseBusiness,
  Building2,
  Car,
  Check,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  LockKeyhole,
  PackageCheck,
  PackageSearch,
  Search,
  ShieldCheck,
  Store,
  Truck
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatBdt, publicProducts, type PublicProduct } from "@/lib/publicCatalog";

type ApiProduct = Omit<PublicProduct, "priceBdt"> & {
  id: string;
  priceBdt: number;
  isActive: boolean;
  estimatedDeliveryNote?: string | null;
};

type PublicOrder = {
  orderId: string;
  orderNumber: string;
  trackingCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotalBdt: number;
  deliveryFeeBdt: number;
  totalBdt: number;
  productName: string;
  quantity: number;
  customerName: string;
  deliveryCity?: string | null;
  deliveryDistrict?: string | null;
  createdAt: string;
};

function normalizeBangladeshPhone(value: string) {
  const trimmed = value.trim().replace(/[\s-]/g, "");
  if (/^\+?8801[3-9]\d{8}$/.test(trimmed)) return `+${trimmed.replace(/^\+/, "")}`;
  if (/^01[3-9]\d{8}$/.test(trimmed)) return `+88${trimmed}`;
  return "";
}

function productFromApi(product: ApiProduct): PublicProduct {
  const fallback = publicProducts.find((item) => item.slug === product.slug);
  return {
    slug: product.slug,
    name: product.name,
    shortName: fallback?.shortName || product.name,
    description: product.description,
    priceBdt: product.priceBdt,
    bestUseCase: product.bestUseCase || fallback?.bestUseCase || product.description,
    features: product.features?.length ? product.features : fallback?.features || [],
    included: product.included?.length ? product.included : fallback?.included || [],
    seoTitle: product.seoTitle || fallback?.seoTitle || product.name,
    seoDescription: product.seoDescription || fallback?.seoDescription || product.description,
    faq: Array.isArray(product.faq) && product.faq.length ? product.faq : fallback?.faq || []
  };
}

export function BuyProductsClient() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("All");

  useEffect(() => {
    apiFetch<{ products: ApiProduct[] }>("/public/products", {}, "")
      .then((data) => setProducts(data.products.map(productFromApi)))
      .catch((err) => {
        setProducts(publicProducts);
        setError(err instanceof Error ? err.message : "Could not load products.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="premium-card p-5">
            <div className="h-44 rounded-card bg-slate-100" />
            <div className="mt-5 h-5 w-2/3 rounded-full bg-slate-100" />
            <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
            <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }
  if (error && !products.length) {
    return <StateBox tone="error" title="Could not load products" body={error} />;
  }
  if (!products.length) {
    return (
      <StateBox
        title="No QR tag products available yet"
        body="Products will appear here after the admin seeds or creates active products. Run npm run seed:products to add the starter catalog."
      />
    );
  }
  const filteredProducts = activeCategory === "All" ? products : products.filter((product) => productCategory(product) === activeCategory);

  return (
    <div>
      {error ? (
        <div className="mb-6 rounded-card border border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] p-4 text-sm font-semibold leading-6 text-[var(--color-warning-text)]">
          Live product data could not be loaded, so the starter NoNumQR catalog is shown. Checkout will still verify availability.
        </div>
      ) : null}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2" aria-label="Product categories">
        {categoryOptions.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
              activeCategory === category
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-soft"
                : "border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <article key={product.slug} className="premium-card soft-hover flex h-full flex-col overflow-hidden">
            <ProductVisual product={product} />
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[var(--color-primary)]">{productCategory(product)}</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[var(--color-ink-strong)]">{product.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{product.bestUseCase}</p>
                </div>
                <p className="shrink-0 rounded-full bg-[var(--color-primary-soft)] px-3 py-2 text-sm font-extrabold text-[var(--color-primary)]">{formatBdt(product.priceBdt)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-bg)] px-3 py-1 text-xs font-bold text-[var(--color-warning-text)]">
                  <Truck aria-hidden size={13} />
                  COD available
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-page-bg)] px-3 py-1 text-xs font-bold text-[var(--color-muted)]">
                  <BadgeCheck aria-hidden size={13} />
                  Standard QR tag
                </span>
              </div>

              <p className="mt-4 leading-7 text-[var(--color-muted)]">{product.description}</p>
              <ul className="mt-5 grid gap-2 text-sm text-[var(--color-muted)]">
                {product.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary-accent)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-card bg-[var(--color-secondary-soft)] p-3 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                No phone number printed or encoded.
              </p>
              <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2">
                <Link className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-4 py-2 font-bold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]" href={`/checkout?product=${product.slug}`}>
                  Buy Now <ArrowRight aria-hidden size={16} />
                </Link>
                <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-soft border border-[var(--color-border-strong)] px-4 py-2 font-bold text-[var(--color-ink)] transition hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]" href={`/product/${product.slug}`}>
                  Details
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

type ProductCategory = "All" | "Vehicle" | "Lost item" | "Business" | "Apartment" | "Shop";

const categoryOptions: ProductCategory[] = ["All", "Vehicle", "Lost item", "Business", "Apartment", "Shop"];

function productCategory(product: PublicProduct): Exclude<ProductCategory, "All"> {
  if (product.slug.includes("lost")) return "Lost item";
  if (product.slug.includes("business")) return "Business";
  if (product.slug.includes("apartment") || product.slug.includes("parking")) return "Apartment";
  if (product.slug.includes("shop")) return "Shop";
  return "Vehicle";
}

function ProductVisual({ product }: { product: PublicProduct }) {
  return (
    <div className="product-material-surface relative overflow-hidden p-4">
      <div className="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-[var(--color-primary)] shadow-soft">
        {product.shortName}
      </div>
      <div
        className="min-h-44 rounded-card bg-cover bg-center shadow-soft"
        style={{ backgroundImage: "url('/images/nonumqr-premium-product-set.png')" }}
        aria-hidden="true"
      />
      <div className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-soft bg-white/90 text-[var(--color-primary)] shadow-soft">
        <ProductIcon product={product} size={24} />
      </div>
      <div className="qr-shimmer absolute bottom-5 left-5 grid h-14 w-14 grid-cols-5 gap-0.5 rounded-soft bg-[var(--color-ink-strong)] p-1.5" aria-hidden="true">
        {Array.from({ length: 25 }).map((_, index) => (
          <span key={index} className={`rounded-[2px] ${[0, 1, 2, 5, 10, 12, 14, 18, 20, 21, 24].includes(index) ? "bg-white" : "bg-[var(--color-primary-accent)]"}`} />
        ))}
      </div>
      <div className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-[var(--color-ink)] shadow-soft">
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

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("product") || "car-qr-sticker";
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryDistrict: "",
    productSlug: selectedSlug,
    quantity: 1,
    tagLabel: "",
    vehicleNumber: "",
    note: ""
  });

  useEffect(() => {
    apiFetch<{ products: ApiProduct[] }>("/public/products", {}, "")
      .then((data) => {
        setProducts(data.products);
        if (data.products.some((product) => product.slug === selectedSlug)) {
          setForm((value) => ({ ...value, productSlug: selectedSlug }));
        } else if (data.products[0]) {
          setForm((value) => ({ ...value, productSlug: data.products[0].slug }));
        }
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : "Could not load products."))
      .finally(() => setLoading(false));
  }, [selectedSlug]);

  const product = useMemo(() => products.find((item) => item.slug === form.productSlug), [products, form.productSlug]);
  const subtotal = product ? product.priceBdt * form.quantity : 0;
  const delivery = subtotal >= 1000 || subtotal === 0 ? 0 : 80;
  const total = subtotal + delivery;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const normalizedPhone = normalizeBangladeshPhone(form.phone);
    if (!normalizedPhone) {
      setStatus("Enter a valid Bangladesh mobile number.");
      return;
    }
    if (!product) {
      setStatus("Choose an available QR tag product.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiFetch<{ order: PublicOrder }>(
        "/public/orders",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            phone: normalizedPhone,
            quantity: Number(form.quantity),
            paymentMethod: "COD"
          })
        },
        ""
      );
      window.sessionStorage.setItem(`nonumqr:order:${data.order.trackingCode}`, JSON.stringify(data.order));
      router.push(`/order-success?order=${encodeURIComponent(data.order.trackingCode)}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not place order. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <CheckoutLoading />;
  if (!products.length) {
    return (
      <StateBox
        title="No products available yet"
        body={status || "QR products will appear here after admin seeds or creates active products."}
      />
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid gap-6">
        <div className="premium-card p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {["Delivery details", "Cash on Delivery", "Order placed"].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-card bg-[var(--color-page-bg)] p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-extrabold text-[var(--color-primary)]">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-[var(--color-ink)]">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <section className="premium-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-ink-strong)]">Delivery information</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Use the receiver details for COD delivery and order confirmation.</p>
            </div>
            <Truck aria-hidden className="hidden text-[var(--color-primary)] sm:block" size={28} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Receiver name" value={form.customerName} onChange={(value) => update("customerName", value)} required />
            <Field label="Phone number" value={form.phone} onChange={(value) => update("phone", value)} helper="Use 01XXXXXXXXX, 8801XXXXXXXXX, or +8801XXXXXXXXX." required />
            <label className="grid gap-2 sm:col-span-2">
              <span className="font-bold text-[var(--color-ink-strong)]">Address <Required /></span>
              <textarea
                required
                value={form.deliveryAddress}
                onChange={(event) => update("deliveryAddress", event.target.value)}
                className="min-h-28 rounded-soft border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-accent)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              />
            </label>
            <Field label="City" value={form.deliveryCity} onChange={(value) => update("deliveryCity", value)} required />
            <Field label="District" value={form.deliveryDistrict} onChange={(value) => update("deliveryDistrict", value)} required />
          </div>
        </section>

        <section className="premium-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-ink-strong)]">Product and tag details</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Quantity and optional labels help the operator prepare the right QR tag.</p>
            </div>
            <PackageCheck aria-hidden className="hidden text-[var(--color-primary)] sm:block" size={28} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-bold text-[var(--color-ink-strong)]">Product <Required /></span>
              <select
                value={form.productSlug}
                onChange={(event) => update("productSlug", event.target.value)}
                className="min-h-12 rounded-soft border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-accent)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              >
                {products.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="font-bold text-[var(--color-ink-strong)]">Quantity <Required /></span>
              <input
                type="number"
                min={1}
                max={20}
                value={form.quantity}
                onChange={(event) => update("quantity", Number(event.target.value))}
                className="min-h-12 rounded-soft border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-accent)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              />
            </label>
            <Field label="Optional tag label" value={form.tagLabel} onChange={(value) => update("tagLabel", value)} helper="Example: My Car, Shop Counter, Laptop Bag." />
            <Field label="Optional vehicle number" value={form.vehicleNumber} onChange={(value) => update("vehicleNumber", value)} />
            <label className="grid gap-2 sm:col-span-2">
              <span className="font-bold text-[var(--color-ink-strong)]">Delivery notes</span>
              <textarea
                value={form.note}
                onChange={(event) => update("note", event.target.value)}
                className="min-h-24 rounded-soft border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-accent)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              />
            </label>
          </div>
        </section>

        <section className="premium-card border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] p-5">
          <div className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-soft bg-white text-[var(--color-warning)] shadow-soft">
              <CreditCard aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-ink-strong)]">Cash on Delivery selected</h2>
              <p className="mt-2 leading-7 text-[var(--color-muted)]">
                Cash on Delivery is the working payment method. No online payment gateway is selected for this order.
              </p>
            </div>
          </div>
        </section>
      </div>

      <aside className="h-fit lg:sticky lg:top-24">
        <div className="premium-card overflow-hidden">
          <div className="bg-[var(--color-ink-strong)] p-6 text-white">
            <div className="flex items-center gap-2 text-[var(--color-primary-soft)]">
              <ShieldCheck aria-hidden size={18} />
              <span className="font-extrabold">Privacy protected checkout</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              We never print or encode your phone number inside the QR code.
            </p>
          </div>

          <div className="p-6">
            <div className="rounded-card bg-[var(--color-page-bg)] p-4">
              <p className="text-sm font-bold text-[var(--color-muted)]">Product summary</p>
              <h2 className="mt-1 text-xl font-extrabold text-[var(--color-ink-strong)]">{product?.name || "QR tag"}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Your QR tag will be assigned after order processing.</p>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <Row label="Quantity" value={`${form.quantity}`} />
              <Row label="Subtotal" value={`BDT ${subtotal}`} />
              <Row label="Delivery" value={delivery ? `BDT ${delivery}` : "Free"} />
              <Row label="Payment" value="Cash on Delivery" />
              <div className="border-t border-[var(--color-border)] pt-3">
                <Row label="Total" value={`BDT ${total}`} strong />
              </div>
            </div>

            {status ? (
              <p className="mt-5 rounded-card border border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] p-3 text-sm font-bold leading-6 text-[var(--color-warning-text)]">
                {status}
              </p>
            ) : null}

            <button
              disabled={submitting}
              className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-soft bg-[var(--color-primary)] px-5 py-3 font-extrabold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Placing order..." : "Place COD order"}
            </button>

            <div className="mt-5 grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
              <span className="flex items-center gap-2"><Check aria-hidden size={14} className="text-[var(--color-primary-accent)]" />Cash on Delivery available</span>
              <span className="flex items-center gap-2"><Check aria-hidden size={14} className="text-[var(--color-primary-accent)]" />Phone number hidden by default</span>
              <span className="flex items-center gap-2"><Check aria-hidden size={14} className="text-[var(--color-primary-accent)]" />QR contains only a public URL</span>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}

export function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const trackingCode = searchParams.get("order") || "";
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trackingCode) return;
    const cached = window.sessionStorage.getItem(`nonumqr:order:${trackingCode}`);
    if (cached) {
      try {
        setOrder(JSON.parse(cached));
        return;
      } catch {
        window.sessionStorage.removeItem(`nonumqr:order:${trackingCode}`);
      }
    }
    apiFetch<{ order: PublicOrder }>(`/public/orders/${encodeURIComponent(trackingCode)}`, {}, "")
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load order."));
  }, [trackingCode]);

  return (
    <div className="premium-card overflow-hidden">
      <div className="bg-[var(--color-ink-strong)] p-6 text-white md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-primary-accent)] text-white shadow-soft">
              <CheckCircle2 aria-hidden size={30} />
            </span>
            <h1 className="mt-5 text-3xl font-bold md:text-5xl">Your QR tag order has been placed.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
              We will confirm the order, print or assign your QR tag, arrange delivery, and help you activate NoNumQR from the owner app.
            </p>
          </div>
          <div className="rounded-card bg-white/10 p-5">
            <p className="text-sm font-bold text-slate-300">Tracking code</p>
            <p className="mt-2 break-words text-2xl font-extrabold text-white">{trackingCode || order?.trackingCode || "NNQR-2026-4829"}</p>
            <p className="mt-3 text-xs leading-5 text-slate-300">Example format: NNQR-2026-4829 or NQR-4829.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_0.85fr]">
        <div className="grid gap-6">
          {error ? (
            <div className="rounded-card border border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] p-4 text-sm font-semibold leading-6 text-[var(--color-warning-text)]">
              {error}
            </div>
          ) : null}

          <section className="rounded-card border border-[var(--color-border)] bg-[var(--color-page-bg)] p-5">
            <h2 className="text-xl font-extrabold text-[var(--color-ink-strong)]">Order summary</h2>
            {order ? (
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Order number" value={order.orderNumber} />
                <Row label="Tracking code" value={order.trackingCode} />
                <Row label="Product" value={order.productName} />
                <Row label="Quantity" value={`${order.quantity}`} />
                <Row label="Payment method" value="Cash on Delivery" />
                <Row label="Total" value={`BDT ${order.totalBdt}`} strong />
              </div>
            ) : (
              <p className="mt-3 leading-7 text-[var(--color-muted)]">
                Order details will appear here when they are available from the confirmation link or local checkout handoff.
              </p>
            )}
          </section>

          <section className="rounded-card border border-[var(--color-primary-accent)]/20 bg-[var(--color-secondary-soft)] p-5">
            <div className="flex gap-3">
              <ShieldCheck aria-hidden className="mt-1 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
              <div>
                <h2 className="font-extrabold text-[var(--color-ink-strong)]">Privacy reminder</h2>
                <p className="mt-2 leading-7 text-[var(--color-muted)]">
                  Your phone number is not printed or encoded in the QR. The QR contains only a public NoNumQR URL.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="grid gap-6">
          <section className="rounded-card border border-[var(--color-border)] bg-white p-5">
            <h2 className="text-xl font-extrabold text-[var(--color-ink-strong)]">Next steps</h2>
            <OrderSteps />
          </section>
          <div className="grid gap-3">
            <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft bg-[var(--color-primary)] px-5 py-3 font-extrabold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)]" href="/track-order">
              Track Order
            </Link>
            <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft border border-[var(--color-border-strong)] bg-white px-5 py-3 font-extrabold text-[var(--color-ink)] transition hover:border-[var(--color-primary-accent)] hover:text-[var(--color-primary)]" href="/download-app">
              Download Owner App
            </Link>
            <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-soft border border-[var(--color-border)] bg-[var(--color-page-bg)] px-5 py-3 font-extrabold text-[var(--color-primary)] transition hover:border-[var(--color-primary-accent)]" href="/buy">
              Buy another QR Tag
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function TrackOrderClient() {
  const [trackingCode, setTrackingCode] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const data = await apiFetch<{ order: PublicOrder }>(`/public/orders/${encodeURIComponent(trackingCode.trim())}`, {}, "");
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-6">
        <section className="premium-card p-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="grid gap-2">
              <span className="font-bold text-[var(--color-ink-strong)]">Order tracking code</span>
              <input
                value={trackingCode}
                onChange={(event) => setTrackingCode(event.target.value)}
                required
                className="min-h-12 rounded-soft border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-accent)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                placeholder="NNQR-2026-4829"
              />
            </label>
            <button disabled={loading} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-soft bg-[var(--color-primary)] px-6 py-3 font-extrabold text-white shadow-soft transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? "Checking..." : "Track"}
              <Search aria-hidden size={18} />
            </button>
          </form>

          {error ? (
            <div className="mt-5 rounded-card border border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] p-4">
              <div className="flex gap-3">
                <AlertCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" />
                <div>
                  <h2 className="font-extrabold text-[var(--color-ink-strong)]">Order not found</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-warning-text)]">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          {!order && !error ? (
            <div className="mt-6 rounded-card bg-[var(--color-page-bg)] p-5">
              <PackageSearch aria-hidden className="text-[var(--color-primary)]" size={28} />
              <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">Enter a tracking code to begin.</h2>
              <p className="mt-2 leading-7 text-[var(--color-muted)]">
                Use a NoNumQR tracking code such as NNQR-2026-4829 or NQR-4829 from your order confirmation.
              </p>
            </div>
          ) : null}
        </section>

        {order ? (
          <>
            <section className="premium-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--color-primary)]">Tracking result</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-ink-strong)]">{order.orderNumber}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Tracking code: {order.trackingCode}</p>
                </div>
                <StatusBadge value={order.status} />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <SummaryTile label="Product" value={order.productName} />
                <SummaryTile label="Quantity" value={`${order.quantity}`} />
                <SummaryTile label="Payment/COD status" value={humanizeStatus(order.paymentStatus)} tone="warning" />
                <SummaryTile label="Total" value={`BDT ${order.totalBdt}`} strong />
              </div>
            </section>

            <section className="premium-card p-6">
              <h2 className="text-xl font-bold text-[var(--color-ink-strong)]">Order status timeline</h2>
              <OrderStatusTimeline status={order.status} />
            </section>
          </>
        ) : null}
      </div>

      <aside className="grid h-fit gap-6 lg:sticky lg:top-24">
        <section className="premium-card border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] p-6">
          <CreditCard aria-hidden className="text-[var(--color-warning)]" size={28} />
          <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">Cash on Delivery</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            COD status is shown with your order. Payment is collected at delivery when applicable.
          </p>
        </section>
        <section className="premium-card p-6">
          <HelpCircle aria-hidden className="text-[var(--color-primary)]" size={28} />
          <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">Need help?</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            If the tracking code does not work, check the code from your confirmation or contact support.
          </p>
          <Link href="/contact" className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center rounded-soft border border-[var(--color-border-strong)] px-4 py-2 font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary-accent)]">
            Contact support
          </Link>
        </section>
        <section className="premium-card border-[var(--color-primary-accent)]/20 bg-[var(--color-secondary-soft)] p-6">
          <ShieldCheck aria-hidden className="text-[var(--color-primary)]" size={28} />
          <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">Privacy reminder</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            QR tags contain only public NoNumQR URLs. Your phone number stays hidden by default.
          </p>
        </section>
      </aside>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid gap-6">
        {[0, 1, 2].map((item) => (
          <div key={item} className="premium-card animate-pulse p-6">
            <div className="h-6 w-48 rounded-full bg-slate-200" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="h-12 rounded-soft bg-slate-100" />
              <div className="h-12 rounded-soft bg-slate-100" />
              <div className="h-24 rounded-soft bg-slate-100 sm:col-span-2" />
            </div>
          </div>
        ))}
      </div>
      <div className="premium-card h-fit animate-pulse p-6">
        <div className="h-6 w-40 rounded-full bg-slate-200" />
        <div className="mt-6 h-32 rounded-card bg-slate-100" />
        <div className="mt-6 h-12 rounded-soft bg-slate-100" />
      </div>
    </div>
  );
}

function OrderSteps() {
  const steps = [
    "We confirm your order",
    "Your QR tag is printed or assigned",
    "Delivery is arranged",
    "You activate and use NoNumQR"
  ];

  return (
    <ol className="mt-5 grid gap-4">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3 rounded-card bg-[var(--color-page-bg)] p-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-primary-soft)] text-sm font-extrabold text-[var(--color-primary)]">
            {index + 1}
          </span>
          <span className="self-center text-sm font-bold leading-6 text-[var(--color-ink)]">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function humanizeStatus(value: string) {
  const normalized = value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").toLowerCase();
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    printed: "Printed/assigned",
    assigned: "Printed/assigned",
    out_for_delivery: "Out for delivery",
    "out for delivery": "Out for delivery",
    delivered: "Delivered",
    cod_pending: "COD pending",
    "cod pending": "COD pending",
    cod_collected: "COD collected",
    "cod collected": "COD collected",
    cancelled: "Cancelled",
    canceled: "Cancelled"
  };

  return labels[normalized] || normalized.replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Pending";
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("cancel")) return "danger";
  if (normalized.includes("deliver") || normalized.includes("collect")) return "success";
  if (normalized.includes("confirm") || normalized.includes("process") || normalized.includes("print") || normalized.includes("assign") || normalized.includes("out")) return "info";
  return "warning";
}

function StatusBadge({ value }: { value: string }) {
  const tone = statusTone(value);
  const className =
    tone === "danger"
      ? "border-[var(--color-danger)]/25 bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]"
      : tone === "success"
        ? "border-[var(--color-primary-accent)]/25 bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
        : tone === "info"
          ? "border-[var(--color-info)]/25 bg-[var(--color-info-bg)] text-[var(--color-info-text)]"
          : "border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]";

  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] ${className}`}>
      {humanizeStatus(value)}
    </span>
  );
}

function SummaryTile({ label, value, strong, tone = "default" }: { label: string; value: string; strong?: boolean; tone?: "default" | "warning" }) {
  return (
    <div className={`rounded-card border p-4 ${tone === "warning" ? "border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)]" : "border-[var(--color-border)] bg-[var(--color-page-bg)]"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</p>
      <p className={`mt-2 text-[var(--color-ink-strong)] ${strong ? "text-2xl font-extrabold" : "font-extrabold"}`}>{value}</p>
    </div>
  );
}

function OrderStatusTimeline({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const cancelled = normalized.includes("cancel");
  const current =
    normalized.includes("deliver") && !normalized.includes("out")
      ? 4
      : normalized.includes("out")
        ? 3
        : normalized.includes("print") || normalized.includes("assign") || normalized.includes("process")
          ? 2
          : normalized.includes("confirm")
            ? 1
            : 0;
  const steps = ["Order placed", "Confirmed", "Printed/assigned", "Out for delivery", "Delivered"];

  return (
    <div className="mt-6 grid gap-3">
      {cancelled ? (
        <div className="rounded-card border border-[var(--color-danger)]/25 bg-[var(--color-danger-bg)] p-4 text-sm font-bold leading-6 text-[var(--color-danger-text)]">
          This order is marked as cancelled.
        </div>
      ) : null}
      {steps.map((step, index) => {
        const complete = !cancelled && index <= current;
        return (
          <div key={step} className="flex gap-3">
            <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${complete ? "border-[var(--color-primary-accent)] bg-[var(--color-primary)] text-white" : "border-[var(--color-border-strong)] bg-white text-[var(--color-muted)]"}`}>
              {complete ? <Check aria-hidden size={15} /> : index + 1}
            </span>
            <div className="pb-3">
              <p className="font-extrabold text-[var(--color-ink-strong)]">{step}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                {index === 0 ? "Your order request was received." : null}
                {index === 1 ? "The NoNumQR team confirms the order details." : null}
                {index === 2 ? "Your QR tag is printed or assigned with a public URL." : null}
                {index === 3 ? "Delivery is arranged for the receiver address." : null}
                {index === 4 ? "The QR tag reaches you and COD can be collected." : null}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value, onChange, helper, required }: { label: string; value: string; onChange: (value: string) => void; helper?: string; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="font-bold text-[var(--color-ink-strong)]">{label} {required ? <Required /> : null}</span>
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-soft border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-accent)] focus:ring-4 focus:ring-[var(--focus-ring)]"
      />
      {helper ? <span className="text-xs leading-5 text-[var(--color-muted)]">{helper}</span> : null}
    </label>
  );
}

function Required() {
  return <span className="text-[var(--color-danger)]">*</span>;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1 ${strong ? "text-lg font-extrabold" : ""}`}>
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="text-right font-extrabold text-[var(--color-ink-strong)]">{value}</span>
    </div>
  );
}

function StateBox({ title, body, tone = "info" }: { title: string; body: string; tone?: "info" | "error" }) {
  return (
    <div className={`premium-card p-8 text-center ${tone === "error" ? "border-[var(--color-danger)]/25 bg-[var(--color-danger-bg)]" : ""}`}>
      <AlertCircle className={`mx-auto h-10 w-10 ${tone === "error" ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`} />
      <h2 className="mt-4 text-xl font-extrabold text-[var(--color-ink-strong)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl leading-7 text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
