import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "INFITRA — Build Real Fitness Communities",
  description:
    "The platform where creators, studios, and gyms build real communities together through live sessions, challenges, and collaboration.",
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
        {/* General Sans — full set including italics, so the wordmark's
            italic doesn't get browser-synthesized (oblique looks chunky
            and inconsistent vs. the real italic glyphs). */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700,200i,300i,400i,500i,600i,700i&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-surface text-on-surface">
        {children}
      </body>
    </html>
  );
}
