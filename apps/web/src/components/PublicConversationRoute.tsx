"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PublicConversation } from "@/components/PublicConversation";
import { InlineAlert } from "@/components/admin/ui";

function conversationIdFromPath(pathname: string, fallback?: string) {
  const value = pathname.split("/").filter(Boolean).pop() || fallback || "";
  return value.startsWith("__") ? fallback || "" : decodeURIComponent(value);
}

export function PublicConversationRoute() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = conversationIdFromPath(pathname, routeId);
  const token = searchParams.get("token") || "";

  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center bg-[var(--color-page-bg)] px-4 py-8">
      <section className="w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white"><ShieldCheck aria-hidden size={24} /></span>
          <div>
            <p className="text-sm font-bold text-[var(--color-primary)]">ScanContact BD</p>
            <h1 className="text-2xl font-black">Private conversation</h1>
          </div>
        </div>
        <div className="mb-4"><InlineAlert tone="info">Conversation access requires the private token in this URL.</InlineAlert></div>
        {id && token ? (
          <PublicConversation contactRequestId={id} token={token} />
        ) : (
          <InlineAlert tone="danger">Conversation link is missing or invalid.</InlineAlert>
        )}
      </section>
    </main>
  );
}
