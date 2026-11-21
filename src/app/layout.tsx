import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
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
      className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Suspense fallback={<div className="h-16 border-b border-line bg-surface" />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
