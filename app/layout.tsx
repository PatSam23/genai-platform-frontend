import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GenAI Platform",
  description: "Enterprise RAG Interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 flex flex-col h-screen overflow-hidden`}>
        <Navbar />
        {/* The main area takes 100vh minus 64px (navbar height) */}
        <main className="flex-1 h-[calc(100vh-64px)] w-full">
          <ProtectedRoute>{children}</ProtectedRoute>
        </main>
      </body>
    </html>
  );
}