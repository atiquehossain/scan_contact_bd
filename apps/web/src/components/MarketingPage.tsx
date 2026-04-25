import { Header } from "./Header";

export function MarketingPage({ title, kicker, body }: { title: string; kicker: string; body: string }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-14">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-trust">{kicker}</p>
        <h1 className="text-4xl font-black text-ink md:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-[#40504d]">{body}</p>
      </main>
    </>
  );
}
