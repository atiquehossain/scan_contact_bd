import { RedirectToAdmin } from "@/components/RedirectToAdmin";

export function generateStaticParams() {
  return [{ id: "__id__" }];
}

export default function TagPreviewPage() {
  return <RedirectToAdmin />;
}
