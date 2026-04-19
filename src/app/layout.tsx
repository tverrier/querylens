import "./globals.css";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  title: {
    default: "QueryLens — AI-Powered SQL Analysis",
    template: "%s | QueryLens",
  },
  description:
    "Paste a PostgreSQL query, get a visual execution plan, AI-powered bottleneck analysis, and an optimized rewrite — all in seconds.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "QueryLens — AI-Powered SQL Analysis",
    description:
      "Visual execution plans, AI bottleneck analysis, and optimized rewrites for PostgreSQL queries.",
    siteName: "QueryLens",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QueryLens — AI-Powered SQL Analysis",
    description:
      "Visual execution plans, AI bottleneck analysis, and optimized rewrites for PostgreSQL queries.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
