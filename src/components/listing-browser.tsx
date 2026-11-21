"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { errorText, readApi } from "@/components/api-client";
import { detailText, type ListingCard, type LocationOption } from "@/components/listing-types";
import { moduleMeta } from "@/lib/modules";
import type { ListingType } from "@/lib/status";

const inputClass =
  "w-full rounded-md border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent";

export function ListingBrowser({ type }: { type: ListingType }) {
  const meta = moduleMeta[type];
  const router = useRouter();
  const search = useSearchParams();
  const q = search.get("q") ?? "";
  const category = search.get("category") ?? "";
  const location = search.get("location") ?? "";
  const page = Number(search.get("page") || "1") || 1;
  const [items, setItems] = useState<ListingCard[]>([]);
  const [total, setTotal] = useState(0);
  const [places, setPlaces] = useState<LocationOption[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ type, page: String(page), limit: "12" });
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (location) params.set("location", location);

    Promise.all([
      fetch(`/api/listings?${params}`, { cache: "no-store" }).then((response) => readApi<{ items: ListingCard[]; total: number }>(response)),
      fetch("/api/locations", { cache: "no-store" }).then((response) => readApi<LocationOption[]>(response)),
      fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.ok),
    ])
      .then(([listings, locations, me]) => {
        if (cancelled) return;
        setSignedIn(me);
        if (locations.success && locations.data) setPlaces(locations.data);
        if (!listings.success || !listings.data) {
          setState("error");
          setMessage(errorText(listings, "Could not load listings"));
          return;
        }
        setItems(listings.data.items);
        setTotal(listings.data.total);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          setMessage("Could not load listings");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [type, q, category, location, page]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const nextQ = String(form.get("q") || "").trim();
    const nextCategory = String(form.get("category") || "");
    const nextLocation = String(form.get("location") || "");
    if (nextQ) params.set("q", nextQ);
    if (nextCategory) params.set("category", nextCategory);
    if (nextLocation) params.set("location", nextLocation);
    const query = params.toString();
    router.push(query ? `${meta.path}?${query}` : meta.path);
  }

  function go(nextPage: number) {
    const params = new URLSearchParams(search.toString());
    params.set("page", String(nextPage));
    router.push(`${meta.path}?${params}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{meta.title}</h1>
          {type === "material" ? (
            <p className="mt-2 max-w-xl text-sm text-muted">
              BuildLink ET has not inspected items. Ask the owner before you buy or collect anything.
            </p>
          ) : null}
        </div>
        {signedIn ? (
          <Link href={`${meta.path}/new`} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
            {meta.post}
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-accent">
            Log in to post
          </Link>
        )}
      </div>

      <form onSubmit={onSearch} className="mt-6 grid gap-3 sm:grid-cols-4">
        <input className={inputClass} name="q" defaultValue={q} placeholder="Search" aria-label="Search" />
        <select className={inputClass} name="category" defaultValue={category} aria-label="Category">
          <option value="">All categories</option>
          {meta.categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className={inputClass} name="location" defaultValue={location} aria-label="Location">
          <option value="">All towns</option>
          {places.map((place) => (
            <option key={place.id} value={place.name}>
              {place.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-line bg-surface px-4 py-2 font-semibold">
          Filter
        </button>
      </form>

      {state === "loading" ? <p className="mt-8 text-muted">Loading {meta.title.toLowerCase()}...</p> : null}
      {state === "error" ? (
        <p className="mt-8 rounded-md bg-danger-bg px-3 py-2 text-danger" role="alert">
          {message}
        </p>
      ) : null}
      {state === "ready" && items.length === 0 ? <p className="mt-8 text-muted">{meta.empty}</p> : null}
      {state === "ready" && items.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`${meta.path}/${item.id}`} className="block h-full rounded-lg border border-line bg-surface p-4">
                <p className="text-sm text-muted">
                  {item.category} · {item.location.name}
                </p>
                <h2 className="mt-1 font-display text-2xl">{item.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{item.description}</p>
                <p className="mt-3 text-sm">{summary(item)}</p>
                <p className="mt-2 text-sm text-muted">
                  {item.owner.name}, {item.owner.town}
                  {item.type === "professional" && item.verification === "verified" ? " · Reviewed" : ""}
                  {item.type === "material" && item.status === "Reserved" ? " · Reserved" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {total > 12 ? (
        <div className="mt-6 flex items-center gap-3">
          <button type="button" className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => go(page - 1)}>
            Previous
          </button>
          <span className="text-sm text-muted">Page {page}</span>
          <button
            type="button"
            className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
            disabled={page * 12 >= total}
            onClick={() => go(page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function summary(item: ListingCard) {
  if (item.type === "job") {
    return `${detailText(item.details, "employmentType")} · ${detailText(item.details, "experienceLevel")}`;
  }
  if (item.type === "material") {
    return `${detailText(item.details, "quantity")} ${detailText(item.details, "unit")} · ${detailText(item.details, "price")} ETB`;
  }
  if (item.type === "rental") {
    return `${detailText(item.details, "price")} ETB / ${detailText(item.details, "pricePeriod")}`;
  }
  return detailText(item.details, "headline");
}
