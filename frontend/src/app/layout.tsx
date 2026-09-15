import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MatcherApp } from "@/components/matcher-app";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HireRe — Intelligent Resume Matching",
  description:
    "Semantic resume-to-job matching for recruiters. Embeddings, skill ontologies, and explainable AI scores.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-slate-50 to-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
