import { OwnerDetailClient } from "@/components/admin/OwnerDetailClient";

export function generateStaticParams() {
  return [{ ownerId: "__ownerId__" }];
}

export default function OwnerDetailPage() {
  return <OwnerDetailClient />;
}
