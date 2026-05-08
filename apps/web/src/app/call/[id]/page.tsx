import { Suspense } from "react";
import { PublicCallClient } from "@/components/PublicCallClient";

export function generateStaticParams() {
  return [{ id: "__id__" }];
}

export default function PublicCallPage() {
  return (
    <Suspense fallback={null}>
      <PublicCallClient />
    </Suspense>
  );
}
