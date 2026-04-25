import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Brand } from "./Brand";

const nav = [
  ["Admin", "/admin"]
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dbe7e3] bg-[#f6f9f7]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Brand />
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#40504d] md:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-trust">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-[#c9d9d4] bg-white" href="/admin" aria-label="Admin home">
            <ShieldCheck size={18} />
          </Link>
          <Link className="focus-ring inline-flex items-center gap-2 rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white" href="/admin">
            <LockKeyhole size={17} />
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
