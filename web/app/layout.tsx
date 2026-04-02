import type { Metadata } from "next";
import { Rajdhani, Inter } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en" className={`${rajdhani.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-surface text-on-surface">
        {children}
      </body>
    </html>
  );
}
