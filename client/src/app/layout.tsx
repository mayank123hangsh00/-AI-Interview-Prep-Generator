import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PrepKit — AI-Powered Interview Prep Platform",
  description: "Turn any job post into a comprehensive interview prep kit with company research, tailored technical & behavioral questions, flashcards, and a day-by-day study schedule.",
  keywords: ["interview preparation", "AI interview kit", "software engineering interview", "company research", "flashcards"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[#090d16] text-slate-100 antialiased font-sans selection:bg-indigo-500/30 selection:text-indigo-200 min-h-screen relative">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
