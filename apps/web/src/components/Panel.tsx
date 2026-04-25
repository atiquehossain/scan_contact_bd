import { ReactNode } from "react";

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#dbe7e3] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
