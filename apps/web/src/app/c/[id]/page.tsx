import { Suspense } from "react";
import { PublicConversationRoute } from "@/components/PublicConversationRoute";

export function generateStaticParams() {
  return [{ id: "__id__" }];
}

export default function PublicConversationPage() {
  return (
    <Suspense fallback={null}>
      <PublicConversationRoute />
    </Suspense>
  );
}
