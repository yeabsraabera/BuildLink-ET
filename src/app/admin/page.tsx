"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { errorText, readApi } from "@/components/api-client";
import type { ListingCard } from "@/components/listing-types";
import { fieldClass, linkClass, outlineClass, pageClass, primaryClass } from "@/components/ui";

type Stats = {
  users: number;
  listings: number;
  requests: number;
  openReports: number;
  pendingVerifications: number;
  jobs: number;
  materials: number;
  rentals: number;
  professionals: number;
};

type ReportItem = {
  id: string;
  targetId: string;
  reason: string;
  status: string;
  reporter: { name: string; town: string };
};

type LogItem = {
  id: string;
  action: string;
  note?: string;
  createdAt?: string;
  admin: { name: string; town: string };
};

const inputClass = fieldClass;

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState<ListingCard[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  function load() {
    Promise.all([
      fetch("/api/admin/stats", { cache: "no-store" }).then(async (response) => ({
        response,
        body: await readApi<Stats>(response),
      })),
      fetch("/api/admin/verifications", { cache: "no-store" }).then((response) => readApi<ListingCard[]>(response)),
      fetch("/api/admin/reports", { cache: "no-store" }).then((response) => readApi<ReportItem[]>(response)),
      fetch("/api/admin/listings", { cache: "no-store" }).then((response) => readApi<ListingCard[]>(response)),
      fetch("/api/admin/logs", { cache: "no-store" }).then((response) => readApi<LogItem[]>(response)),
    ])
      .then(([statsResult, verificationResult, reportResult, listingResult, logResult]) => {
        if (statsResult.response.status === 401 || statsResult.response.status === 403) {
          setState("error");
          setMessage(statsResult.body.message || "Admin only");
          return;
        }
        if (!statsResult.body.success || !statsResult.body.data) {
          setState("error");
          setMessage(errorText(statsResult.body, "Could not load admin"));
          return;
        }
        setStats(statsResult.body.data);
        setQueue(verificationResult.data ?? []);
        setReports(reportResult.data ?? []);
        setListings(listingResult.data ?? []);
        setLogs(logResult.data ?? []);
        setState("ready");
      })
      .catch(() => {
        setState("error");
        setMessage("Could not load admin");
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function review(listingId: string, verification: "verified" | "rejected") {
    const response = await fetch("/api/admin/verifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, verification }),
    });
    const body = await readApi<{ id: string }>(response);
    if (!response.ok || !body.success) {
      setMessage(errorText(body, "Could not update verification"));
      return;
    }
    setMessage("");
    load();
  }

  async function resolveReport(id: string) {
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    const body = await readApi<{ id: string }>(response);
    if (!response.ok || !body.success) {
      setMessage(errorText(body, "Could not resolve the report"));
      return;
    }
    setMessage("");
    load();
  }

  async function removeListing(id: string) {
    if (!window.confirm("Remove this listing?")) return;
    const response = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Removed" }),
    });
    const body = await readApi<{ id: string }>(response);
    if (!response.ok || !body.success) {
      setMessage(errorText(body, "Could not remove the listing"));
      return;
    }
    setMessage("");
    load();
  }

  async function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        region: form.get("region"),
        zone: form.get("zone"),
      }),
    });
    const body = await readApi<{ id: string }>(response);
    if (!response.ok || !body.success) {
      setMessage(errorText(body, "Could not add the town"));
      return;
    }
    setMessage("Town added.");
    formElement.reset();
    load();
  }

  return (
    <div className={`${pageClass} py-8`}>
      <h1 className="text-2xl">Admin</h1>
      <p className="mt-2 text-sm text-muted">Review flags are not official licenses. BuildLink ET does not certify anyone.</p>
      {state === "loading" ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-line" />
          ))}
          <p className="sr-only">Loading admin...</p>
        </div>
      ) : null}
      {state === "error" ? (
        <p className="mt-6 rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}
      {message && state === "ready" ? <p className="mt-4 text-sm">{message}</p> : null}
      {state === "ready" && stats ? (
        <div className="mt-6 grid gap-8">
          <section className="grid gap-3 sm:grid-cols-4">
            <Stat label="People" value={stats.users} />
            <Stat label="Listings" value={stats.listings} />
            <Stat label="Requests" value={stats.requests} />
            <Stat label="Open reports" value={stats.openReports} />
            <Stat label="Jobs" value={stats.jobs} />
            <Stat label="Materials" value={stats.materials} />
            <Stat label="Rentals" value={stats.rentals} />
            <Stat label="Professionals" value={stats.professionals} />
          </section>

          <section>
            <h2 className="text-xl">Verification queue</h2>
            {queue.length === 0 ? <p className="mt-2 text-sm text-muted">No profiles are waiting.</p> : null}
            <ul className="mt-3 grid gap-3">
              {queue.map((item) => (
                <li key={item.id} className="min-w-0 rounded-xl border border-line bg-card p-4">
                  <Link href={`/professionals/${item.id}`} className={`break-words ${linkClass}`}>
                    {item.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {item.owner.name}, {item.owner.town}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => review(item.id, "verified")} className={primaryClass}>
                      Mark reviewed
                    </button>
                    <button type="button" onClick={() => review(item.id, "rejected")} className={outlineClass}>
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl">Reports</h2>
            {reports.length === 0 ? <p className="mt-2 text-sm text-muted">No reports.</p> : null}
            <ul className="mt-3 grid gap-3">
              {reports.map((report) => (
                <li key={report.id} className="min-w-0 rounded-xl border border-line bg-card p-4">
                  <p className="text-sm text-muted">
                    {report.status} · {report.reporter.name}, {report.reporter.town}
                  </p>
                  <p className="mt-1 break-words">{report.reason}</p>
                  <p className="mt-1 break-all text-sm text-muted">Listing {report.targetId}</p>
                  {report.status === "open" ? (
                    <button type="button" onClick={() => resolveReport(report.id)} className={`${outlineClass} mt-2`}>
                      Resolve
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl">Remove a listing</h2>
            {listings.length === 0 ? <p className="mt-2 text-sm text-muted">No active listings.</p> : null}
            <ul className="mt-3 grid gap-2">
              {listings.map((item) => (
                <li key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-card px-3 py-2">
                  <span className="min-w-0 break-words text-sm">
                    {item.type} · {item.status} · {item.title}
                  </span>
                  <button type="button" onClick={() => removeListing(item.id)} className={outlineClass}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl">Add a town</h2>
            <form onSubmit={addLocation} className="mt-3 grid gap-3 sm:grid-cols-4">
              <input className={inputClass} name="name" required placeholder="Town" aria-label="Town" />
              <input className={inputClass} name="region" required placeholder="Region" aria-label="Region" />
              <input className={inputClass} name="zone" required placeholder="Zone" aria-label="Zone" />
              <button type="submit" className={primaryClass}>
                Add location
              </button>
            </form>
          </section>

          <section>
            <h2 className="text-xl">Audit log</h2>
            {logs.length === 0 ? <p className="mt-2 text-sm text-muted">No admin actions yet.</p> : null}
            <ul className="mt-3 grid gap-2">
              {logs.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <span className="text-muted">{entry.createdAt ? when(entry.createdAt) : ""}</span> {entry.admin.name} {entry.action}
                  {entry.note ? ` (${entry.note})` : ""}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl">{value}</p>
    </div>
  );
}

function when(value: string) {
  return (
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Addis_Ababa",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value)) + " EAT"
  );
}
