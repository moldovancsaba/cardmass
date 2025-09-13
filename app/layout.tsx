import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "cardmass",
  description: "3-column card chat (roadmap/backlog/todo) with MongoDB persistence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black xl:h-screen xl:overflow-hidden`}
      >
        {/* Provide runtime settings to the entire app so UI colors are consistent */}
        {/* The provider fetches /api/settings once on mount and keeps values in memory */}
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
