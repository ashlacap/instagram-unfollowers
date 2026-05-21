import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Instagram Unfollowers",
  description:
    "Find out who doesn't follow you back on Instagram — no login required.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gradient-to-br from-slate-50 via-white to-pink-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
