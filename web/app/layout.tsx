import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const viewport: Viewport = {
  // Tints the browser chrome (iOS Safari bars, Android status bar) to the
  // wave base color instead of leaving it to sample whatever sits at the
  // page edge.
  themeColor: "#F2EFE8",
};

export const metadata: Metadata = {
  title: "INFITRA · Live, co-created fitness experiences",
  description:
    "Complementary experts, one live fitness experience. INFITRA provides the live rooms, the tribe space, the marketing page with checkout, the collaboration contract and the revenue splitting.",
  openGraph: {
    title: "INFITRA",
    description: "Live fitness experiences. Built around participation.",
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/* General Sans — upright weights only. The INFITRA wordmark's
            italic look comes from the browser synthesising oblique from
            the upright bold; that's the characteristic thicker italic
            production has always rendered. Loading real italic variants
            replaces that with thinner real-italic glyphs, which loses
            the brand feel. Keep upright-only. */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap"
        />
      </head>
      {/* no bg-surface here — the utility would override the #F2EFE8 canvas
          rule in globals.css with the grey surface token */}
      <body className="min-h-full flex flex-col antialiased text-on-surface">
        {children}
      </body>
    </html>
  );
}
