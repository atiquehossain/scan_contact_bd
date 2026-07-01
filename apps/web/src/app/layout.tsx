import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND_NAME } from "@/lib/brand";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "Contact without revealing your number.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
