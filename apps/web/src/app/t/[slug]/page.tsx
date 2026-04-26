import { ScanClient } from "@/components/ScanClient";

export function generateStaticParams() {
  return [{ slug: "__slug__" }];
}

export default function Page() {
  return <ScanClient />;
}
