import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <BrandLogo className="h-24" />
          <p className="mt-2 text-sm leading-6 text-white/75">
            Construction jobs, contractors, surplus materials, and equipment rentals in Southwest Ethiopia.
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <Link href="/jobs" className="hover:text-accent">
            Jobs
          </Link>
          <Link href="/materials" className="hover:text-accent">
            Materials
          </Link>
          <Link href="/rentals" className="hover:text-accent">
            Rentals
          </Link>
          <Link href="/professionals" className="hover:text-accent">
            Professionals
          </Link>
        </div>
        <p className="text-sm leading-6 text-white/75">
          BuildLink ET is a prototype. It does not take payments, hold escrow, insure equipment, or officially
          verify people, materials, or equipment.
        </p>
      </div>
    </footer>
  );
}
