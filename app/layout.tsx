import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Email template storing app",
  description: "Email template storing app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark antialiased ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans">
        <Toaster position="bottom-right" richColors />
          {children}
      </body>
    </html>
  );
}
