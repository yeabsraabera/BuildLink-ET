import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const themeScript = `(function(){try{if(localStorage.getItem("buildlink-theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export const metadata: Metadata = {
  title: {
    default: "BuildLink ET",
    template: "%s | BuildLink ET",
  },
  description:
    "Construction jobs, surplus materials, equipment rentals, and professionals in Southwest Ethiopia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-w-0 flex-col overflow-x-clip font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Suspense fallback={<div className="h-14 bg-navy" />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
