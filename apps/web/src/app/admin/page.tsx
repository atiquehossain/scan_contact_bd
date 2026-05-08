"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/overview");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6">
      <p className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 text-sm font-bold text-[var(--color-muted)]">
        Opening admin panel...
      </p>
    </main>
  );
}
