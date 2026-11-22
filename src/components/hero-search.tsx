"use client";

import { useRouter } from "next/navigation";
import { type FormEvent } from "react";

import type { TownOption } from "@/lib/locations";

const modules = [
  { path: "/jobs", label: "Jobs" },
  { path: "/materials", label: "Materials" },
  { path: "/rentals", label: "Rentals" },
  { path: "/professionals", label: "Professionals" },
] as const;

const heroField =
  "w-full min-w-0 rounded-xl border border-white/30 bg-[#fffdfb] px-3 py-2.5 text-sm text-[#241c18] outline-none placeholder:text-[#6e6258]";

export function HeroSearch({ towns }: { towns: TownOption[] }) {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const modulePath = String(form.get("module") || "/jobs");
    const allowed = modules.some((item) => item.path === modulePath);
    const path = allowed ? modulePath : "/jobs";
    const params = new URLSearchParams();
    const q = String(form.get("q") || "").trim();
    const location = String(form.get("location") || "").trim();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    const query = params.toString();
    router.push(query ? `${path}?${query}` : path);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 grid w-full max-w-3xl gap-2 text-left sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="grid min-w-0 gap-1 text-xs text-white/80">
        Module
        <select className={heroField} name="module" defaultValue="/jobs" aria-label="Module">
          {modules.map((item) => (
            <option key={item.path} value={item.path}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1 text-xs text-white/80">
        Keyword
        <input className={heroField} name="q" placeholder="Keyword" aria-label="Keyword" />
      </label>
      <label className="grid min-w-0 gap-1 text-xs text-white/80">
        Town
        <select className={heroField} name="location" defaultValue="" aria-label="Town">
          <option value="">All towns</option>
          {towns.map((town) => (
            <option key={town.id} value={town.name}>
              {town.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm text-accent-ink hover:bg-accent-hover"
        >
          Search
        </button>
      </div>
    </form>
  );
}
