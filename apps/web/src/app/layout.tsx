import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/api";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Bangladesh-first QR private contact platform.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
