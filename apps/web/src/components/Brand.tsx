import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

export function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 font-bold text-ink">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-trust text-white">
        <ShieldCheck aria-hidden size={23} />
      </span>
      <span>{BRAND_NAME}</span>
    </Link>
  );
}
