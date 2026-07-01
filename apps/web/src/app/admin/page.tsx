"use client";

import { useEffect } from "react";

export default function AdminIndexPage() {
  useEffect(() => {
    window.location.replace("/admin/overview");
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6">
      <p className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 text-sm font-bold text-[var(--color-muted)]">
        Opening admin panel...
      </p>
    </main>
  );
}
