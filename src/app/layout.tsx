import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Inter, self-hosted (DESIGN.md: geen externe requests). Variabel font 100–900.
const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "JIP-ATS",
    template: "%s · JIP-ATS",
  },
  description: "Het recruitmentsysteem van Jump Into People",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
