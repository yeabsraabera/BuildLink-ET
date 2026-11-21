import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeSync } from "@/components/theme-toggle";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const themeScript = `(function(){try{var dark=localStorage.getItem("buildlink-theme")==="dark";var root=document.documentElement;root.setAttribute("data-theme",dark?"dark":"light");root.classList.toggle("dark",dark);root.style.colorScheme=dark?"dark":"light";}catch(e){}})()`;

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
      <body className="flex min-h-full min-w-0 flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeSync />
        <Suspense fallback={<div className="h-14 bg-navy" />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
