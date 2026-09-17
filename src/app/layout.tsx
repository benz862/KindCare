import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";

import { brand } from "@/lib/copy";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description: `${brand.tagline} ${brand.name} by ${brand.owner} provides supportive companionship and household care coordination.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-cloud font-sans text-ink">{children}</body>
    </html>
  );
}
