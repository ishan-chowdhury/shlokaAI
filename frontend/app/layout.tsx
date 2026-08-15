import type { Metadata } from "next";
import { Cinzel, Lora } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "shlokaAI — Wisdom from the Bhagavad Gita",
  description:
    "Share what weighs on your heart. shlokaAI finds guidance from the Bhagavad Gita, grounded in Sanskrit and scholarly translations.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "shlokaAI",
    description: "Guidance from the Bhagavad Gita for modern life.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${cinzel.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
