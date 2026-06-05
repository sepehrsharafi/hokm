import type { Metadata } from "next";
import {
  Fraunces,
  Hanken_Grotesk,
  Markazi_Text,
  Space_Mono,
  Vazirmatn,
} from "next/font/google";
import "./globals.css";

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
});

const mono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const persianSans = Vazirmatn({
  variable: "--font-fa-sans",
  subsets: ["arabic"],
});

const persianSerif = Markazi_Text({
  variable: "--font-fa-serif",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Hokm",
  description: "Beautiful real-time Hokm for four guests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable} ${persianSans.variable} ${persianSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
