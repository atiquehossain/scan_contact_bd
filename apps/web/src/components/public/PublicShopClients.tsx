"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, PackageSearch, ShieldCheck } from "lucide-react";
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

  useEffect(() => {
    apiFetch<{ products: ApiProduct[] }>("/public/products", {}, "")
      .then((data) => setProducts(data.products.map(productFromApi)))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center font-bold text-slate-600">Loading QR tag products...</div>;
  }
  if (error) {
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
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <article key={product.slug} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">{product.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{product.bestUseCase}</p>
            </div>
            <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-lg font-black text-emerald-700">{formatBdt(product.priceBdt)}</p>
          </div>
          <p className="mt-4 leading-7 text-slate-600">{product.description}</p>
          <ul className="mt-5 grid gap-2 text-sm text-slate-700">
            {product.features.map((feature) => (
              <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />{feature}</li>
            ))}
          </ul>
          <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-2">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 font-black text-white" href={`/checkout?product=${product.slug}`}>
              Buy Now
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 font-black" href={`/product/${product.slug}`}>
              Details
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
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
      window.sessionStorage.setItem(`scancontact:order:${data.order.trackingCode}`, JSON.stringify(data.order));
      router.push(`/order-success?order=${encodeURIComponent(data.order.trackingCode)}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not place order. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center font-bold">Loading checkout...</div>;
  if (!products.length) return <StateBox title="No products available yet" body="QR products will appear here after admin seeds or creates active products." />;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={form.customerName} onChange={(value) => update("customerName", value)} required />
          <Field label="Phone number" value={form.phone} onChange={(value) => update("phone", value)} helper="Use 01XXXXXXXXX, 8801XXXXXXXXX, or +8801XXXXXXXXX." required />
          <label className="grid gap-2 sm:col-span-2">
            <span className="font-bold">Delivery address <Required /></span>
            <textarea required value={form.deliveryAddress} onChange={(event) => update("deliveryAddress", event.target.value)} className="min-h-28 rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <Field label="City" value={form.deliveryCity} onChange={(value) => update("deliveryCity", value)} required />
          <Field label="District" value={form.deliveryDistrict} onChange={(value) => update("deliveryDistrict", value)} required />
          <label className="grid gap-2">
            <span className="font-bold">Product <Required /></span>
            <select value={form.productSlug} onChange={(event) => update("productSlug", event.target.value)} className="min-h-12 rounded-2xl border border-slate-300 px-4 py-3">
              {products.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="font-bold">Quantity <Required /></span>
            <input type="number" min={1} max={20} value={form.quantity} onChange={(event) => update("quantity", Number(event.target.value))} className="min-h-12 rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <Field label="Optional tag label" value={form.tagLabel} onChange={(value) => update("tagLabel", value)} helper="Example: My Car, Shop Counter, Laptop Bag." />
          <Field label="Optional vehicle number" value={form.vehicleNumber} onChange={(value) => update("vehicleNumber", value)} />
          <label className="grid gap-2 sm:col-span-2">
            <span className="font-bold">Optional note</span>
            <textarea value={form.note} onChange={(event) => update("note", event.target.value)} className="min-h-24 rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
      </div>
      <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex items-center gap-2 text-emerald-300"><ShieldCheck size={18} /><span className="font-black">Privacy protected checkout</span></div>
        <p className="mt-3 text-sm leading-6 text-slate-300">Your QR tag will not show your phone number. Your phone is used for account activation and delivery contact.</p>
        <div className="mt-6 space-y-3 text-sm">
          <Row label="Product" value={product?.name || "QR tag"} />
          <Row label="Quantity" value={`${form.quantity}`} />
          <Row label="Subtotal" value={`BDT ${subtotal}`} />
          <Row label="Delivery" value={delivery ? `BDT ${delivery}` : "Free"} />
          <Row label="Payment" value="Cash on Delivery" />
          <div className="border-t border-white/10 pt-3">
            <Row label="Total" value={`BDT ${total}`} strong />
          </div>
        </div>
        {status ? <p className="mt-4 rounded-2xl bg-amber-100 p-3 text-sm font-bold text-amber-900">{status}</p> : null}
        <button disabled={submitting} className="mt-6 min-h-12 w-full rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-70">
          {submitting ? "Placing order..." : "Place COD order"}
        </button>
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
    const cached = window.sessionStorage.getItem(`scancontact:order:${trackingCode}`);
    if (cached) {
      try {
        setOrder(JSON.parse(cached));
        return;
      } catch {
        window.sessionStorage.removeItem(`scancontact:order:${trackingCode}`);
      }
    }
    apiFetch<{ order: PublicOrder }>(`/public/orders/${encodeURIComponent(trackingCode)}`, {}, "")
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load order."));
  }, [trackingCode]);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <CheckCircle2 className="h-12 w-12 text-emerald-600" />
      <h1 className="mt-5 text-3xl font-black">Your QR tag order has been placed.</h1>
      <p className="mt-3 leading-7 text-slate-600">Download the ScanContact BD Owner App and sign in using the same phone number. After your QR tag is assigned, you will see it inside the app.</p>
      {error ? <p className="mt-4 rounded-2xl bg-amber-100 p-3 font-bold text-amber-900">{error}</p> : null}
      {order ? (
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <Row label="Order number" value={order.orderNumber} />
          <Row label="Product" value={order.productName} />
          <Row label="Quantity" value={`${order.quantity}`} />
          <Row label="Payment method" value="Cash on Delivery" />
          <Row label="Total" value={`BDT ${order.totalBdt}`} strong />
        </div>
      ) : null}
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <h2 className="font-black text-emerald-900">Next steps</h2>
        <ol className="mt-3 grid gap-2 text-sm font-bold text-emerald-900">
          <li>1. Keep your phone active for delivery/contact.</li>
          <li>2. Download the Owner App.</li>
          <li>3. Sign in with the same phone number.</li>
          <li>4. After QR assignment, start receiving private messages.</li>
        </ol>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white" href="/download-app">Download Owner App</Link>
        <Link className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 font-black" href="/track-order">Track Order</Link>
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
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2">
          <span className="font-bold">Order tracking code</span>
          <input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} required className="min-h-12 rounded-2xl border border-slate-300 px-4 py-3" placeholder="SCBD-..." />
        </label>
        <button disabled={loading} className="self-end rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white">{loading ? "Checking..." : "Track"}</button>
      </form>
      {error ? <p className="mt-4 rounded-2xl bg-amber-100 p-3 font-bold text-amber-900">{error}</p> : null}
      {order ? (
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <PackageSearch className="text-emerald-700" />
          <Row label="Order" value={order.orderNumber} />
          <Row label="Product" value={order.productName} />
          <Row label="Status" value={order.status} />
          <Row label="COD status" value={order.paymentStatus} />
          <Row label="Total" value={`BDT ${order.totalBdt}`} strong />
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, helper, required }: { label: string; value: string; onChange: (value: string) => void; helper?: string; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="font-bold">{label} {required ? <Required /> : null}</span>
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 rounded-2xl border border-slate-300 px-4 py-3" />
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

function Required() {
  return <span className="text-red-600">*</span>;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1 ${strong ? "text-lg font-black" : ""}`}>
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-black">{value}</span>
    </div>
  );
}

function StateBox({ title, body, tone = "info" }: { title: string; body: string; tone?: "info" | "error" }) {
  return (
    <div className={`rounded-3xl border p-8 text-center ${tone === "error" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <AlertCircle className={`mx-auto h-10 w-10 ${tone === "error" ? "text-red-600" : "text-emerald-700"}`} />
      <h2 className="mt-4 text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-slate-600">{body}</p>
    </div>
  );
}
