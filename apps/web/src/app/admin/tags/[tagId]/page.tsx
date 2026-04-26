import { AdminTagDetailClient } from "@/components/admin/AdminTagDetailClient";

export function generateStaticParams() {
  return [{ tagId: "__tagId__" }];
}

export default function AdminTagDetailPage() {
  return <AdminTagDetailClient />;
}
