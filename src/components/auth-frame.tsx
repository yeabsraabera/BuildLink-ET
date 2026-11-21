import Image from "next/image";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";

const PHOTO =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80";

export function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-page px-4 py-6 sm:py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-line bg-card md:grid-cols-2">
        <div className="relative min-h-56 bg-navy text-white md:min-h-[40rem]">
          <Image src={PHOTO} alt="" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-navy/70" />
          <div className="relative flex h-full min-h-56 flex-col justify-end p-6 md:min-h-[40rem] md:p-8">
            <BrandLogo href={null} className="h-24" />
            <p className="mt-3 max-w-sm text-3xl leading-tight">Build Smarter. Connect Better. Waste Less.</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">
              Jobs, contractors, surplus materials and equipment rentals across Southwest Ethiopia.
            </p>
            <ul className="mt-6 grid gap-2 text-sm text-white/90">
              <li>Post a job with a clear pay offer</li>
              <li>Find masons, electricians, and site engineers</li>
              <li>Reuse surplus materials and rent equipment</li>
            </ul>
          </div>
        </div>
        <div className="bg-card p-6 text-foreground md:p-8">
          <h1 className="text-2xl">{title}</h1>
          <p className="mt-2 mb-6 text-sm leading-6 text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
