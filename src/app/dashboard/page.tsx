"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { errorText, readApi } from "@/components/api-client";
import type { ListingCard, RequestCard } from "@/components/listing-types";
import { StatusBadge } from "@/components/status-badge";
import { linkClass, moduleEmoji, outlineClass, pageClass, primaryClass } from "@/components/ui";
import { moduleMeta } from "@/lib/modules";
import { isFinalRequestStatus, listingStatus, requestStatus, type ListingType } from "@/lib/status";

export default function DashboardPage() {
  const [incoming, setIncoming] = useState<RequestCard[]>([]);
  const [outgoing, setOutgoing] = useState<RequestCard[]>([]);
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/requests?box=incoming", { cache: "no-store" }).then(async (response) => ({
        response,
        body: await readApi<RequestCard[]>(response),
      })),
      fetch("/api/requests?box=outgoing", { cache: "no-store" }).then((response) => readApi<RequestCard[]>(response)),
      fetch("/api/listings?mine=true", { cache: "no-store" }).then((response) => readApi<{ items: ListingCard[] }>(response)),
    ])
      .then(([incomingResult, outgoingResult, listingResult]) => {
        if (cancelled) return;
        if (incomingResult.response.status === 401) {
          setState("error");
          setMessage("Sign in to open your dashboard.");
          return;
        }
        if (!incomingResult.body.success || !outgoingResult.success || !listingResult.success) {
          setState("error");
          setMessage(errorText(incomingResult.body, "Could not load the dashboard"));
          return;
        }
        setIncoming(incomingResult.body.data ?? []);
        setOutgoing(outgoingResult.data ?? []);
        setListings(listingResult.data?.items ?? []);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          setMessage("Could not load the dashboard");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function setRequestStatus(id: string, status: string) {
    const response = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await readApi<RequestCard>(response);
    if (!response.ok || !body.success) {
      setMessage(errorText(body, "Could not update the request"));
      return;
    }
    setMessage("");
    setReloadKey((value) => value + 1);
  }

  async function setListingStatus(id: string, status: string) {
    const response = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await readApi<ListingCard>(response);
    if (!response.ok || !body.success) {
      setMessage(errorText(body, "Could not update the listing"));
      return;
    }
    setMessage("");
    setReloadKey((value) => value + 1);
  }

  async function removeListing(id: string) {
    if (!window.confirm("Remove this listing from public browse?")) return;
    const response = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    const body = await readApi<{ id: string }>(response);
    if (!response.ok || !body.success) {
      setMessage(errorText(body, "Could not remove the listing"));
      return;
    }
    setMessage("");
    setReloadKey((value) => value + 1);
  }

  return (
    <div className={`${pageClass} py-8`}>
      <h1 className="text-2xl">Dashboard</h1>
      {state === "loading" ? <p className="mt-6 text-sm text-muted">Loading your dashboard...</p> : null}
      {state === "error" ? (
        <div className="mt-6 rounded-xl border border-line bg-card p-6">
          <p className="text-sm text-danger" role="alert">
            {message}
          </p>
          {message.startsWith("Sign in") ? (
            <Link href="/login" className={`${primaryClass} mt-4`}>
              Log in
            </Link>
          ) : null}
        </div>
      ) : null}
      {message && state === "ready" ? (
        <p className="mt-4 break-words rounded-xl border border-line bg-card px-3 py-2 text-sm">{message}</p>
      ) : null}
      {state === "ready" ? (
        <div className="mt-6 grid gap-8">
          <section>
            <h2 className="text-xl">Incoming requests</h2>
            {incoming.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No one has contacted you yet. New applications and inquiries land here.</p>
            ) : null}
            <ul className="mt-3 grid gap-3">
              {incoming.map((item) => (
                <RequestRow key={item.id} item={item} onStatus={setRequestStatus} />
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl">My requests</h2>
            {outgoing.length === 0 ? (
              <div className="mt-2">
                <p className="text-sm text-muted">You have not sent a request yet.</p>
                <Link href="/jobs" className={`${primaryClass} mt-4`}>
                  Browse jobs
                </Link>
              </div>
            ) : null}
            <ul className="mt-3 grid gap-3">
              {outgoing.map((item) => (
                <RequestRow key={item.id} item={item} onStatus={setRequestStatus} />
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl">My listings</h2>
            {listings.length === 0 ? (
              <div className="mt-2">
                <p className="text-sm text-muted">You have not posted anything yet.</p>
                <Link href="/jobs/new" className={`${primaryClass} mt-4`}>
                  Post a job
                </Link>
              </div>
            ) : null}
            <ul className="mt-3 grid gap-3">
              {listings.map((item) => (
                <li key={item.id} className="min-w-0 rounded-xl border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-2xl" aria-hidden>
                      {moduleEmoji[item.type]}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted">{moduleMeta[item.type].title}</p>
                  <Link href={`${moduleMeta[item.type].path}/${item.id}`} className={`mt-1 block break-words text-base ${linkClass}`}>
                    {item.title}
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`${moduleMeta[item.type].path}/${item.id}/edit`} className={outlineClass}>
                      Edit
                    </Link>
                    <button type="button" onClick={() => removeListing(item.id)} className={outlineClass}>
                      Delete
                    </button>
                    {listingStatus[item.type].values
                      .filter((status) => status !== item.status && status !== "Removed")
                      .map((status) => (
                        <button key={status} type="button" onClick={() => setListingStatus(item.id, status)} className={outlineClass}>
                          {status}
                        </button>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function RequestRow({ item, onStatus }: { item: RequestCard; onStatus: (id: string, status: string) => void }) {
  const type = item.type as ListingType;
  const path = moduleMeta[type].path;
  return (
    <li className="min-w-0 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        {item.startDate ? <span className="text-sm text-muted">{item.startDate} to {item.endDate}</span> : null}
      </div>
      <Link href={`${path}/${item.listing.id}`} className={`mt-2 block break-words text-base ${linkClass}`}>
        {item.listing.title || "Listing"}
      </Link>
      <p className="mt-1 text-sm">
        {item.viewer === "to" ? `From ${item.from.name}, ${item.from.town}` : `To ${item.to.name}, ${item.to.town}`}
      </p>
      <p className="mt-1 break-words text-sm text-muted">{item.message}</p>
      {!isFinalRequestStatus(type, item.status) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.viewer === "from" ? (
            <button type="button" onClick={() => onStatus(item.id, "Withdrawn")} className={outlineClass}>
              Withdraw
            </button>
          ) : null}
          {item.viewer === "to"
            ? requestStatus[type].ownerSets.map((status) => (
                <button key={status} type="button" onClick={() => onStatus(item.id, status)} className={outlineClass}>
                  {status}
                </button>
              ))
            : null}
        </div>
      ) : null}
    </li>
  );
}
