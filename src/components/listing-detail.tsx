"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { errorText, readApi } from "@/components/api-client";
import { detailText, type ListingCard, type RequestCard } from "@/components/listing-types";
import { moduleMeta } from "@/lib/modules";
import { isFinalRequestStatus, listingStatus, requestStatus, type ListingType } from "@/lib/status";

const inputClass =
  "w-full rounded-md border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent";

export function ListingDetail({ type, id }: { type: ListingType; id: string }) {
  const meta = moduleMeta[type];
  const router = useRouter();
  const [listing, setListing] = useState<ListingCard | null>(null);
  const [incoming, setIncoming] = useState<RequestCard[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/listings/${id}`, { cache: "no-store" }).then(async (response) => ({
        response,
        body: await readApi<ListingCard>(response),
      })),
      fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.ok),
    ])
      .then(async ([result, me]) => {
        if (cancelled) return;
        setSignedIn(me);
        if (!result.response.ok || !result.body.success || !result.body.data) {
          setState("error");
          setMessage(errorText(result.body, "Could not load this listing"));
          return;
        }
        if (result.body.data.type !== type) {
          setState("error");
          setMessage("This listing is in another module.");
          return;
        }
        setListing(result.body.data);
        if (result.body.data.isOwner) {
          const requests = await fetch("/api/requests?box=incoming", { cache: "no-store" }).then((response) =>
            readApi<RequestCard[]>(response),
          );
          if (!cancelled) setIncoming((requests.data ?? []).filter((item) => item.listing.id === id));
        } else {
          setIncoming([]);
        }
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          setMessage("Could not load this listing");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, type, reloadKey]);

  async function updateListingStatus(status: string) {
    setNotice("");
    const response = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await readApi<ListingCard>(response);
    if (!response.ok || !body.success) {
      setNotice(errorText(body, "Could not update the status"));
      return;
    }
    setReloadKey((value) => value + 1);
  }

  async function removeListing() {
    if (!window.confirm("Remove this listing from public browse?")) return;
    const response = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    const body = await readApi<{ id: string }>(response);
    if (!response.ok || !body.success) {
      setNotice(errorText(body, "Could not remove the listing"));
      return;
    }
    router.push(meta.path);
  }

  async function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const quantity = String(form.get("quantity") || "").trim();
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          listingId: id,
          message: form.get("message"),
          startDate: String(form.get("startDate") || "") || undefined,
          endDate: String(form.get("endDate") || "") || undefined,
          quantity: quantity ? Number(quantity) : undefined,
        }),
      });
      const body = await readApi<RequestCard>(response);
      if (!response.ok || !body.success) {
        setNotice(errorText(body, "Could not send that"));
        return;
      }
      setNotice("Sent. The owner sees your name and town only.");
      event.currentTarget.reset();
    } catch {
      setNotice("Could not send that");
    } finally {
      setPending(false);
    }
  }

  async function updateRequest(requestId: string, status: string) {
    setNotice("");
    const response = await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await readApi<RequestCard>(response);
    if (!response.ok || !body.success) {
      setNotice(errorText(body, "Could not update the request"));
      return;
    }
    setReloadKey((value) => value + 1);
  }

  async function requestVerification() {
    const response = await fetch(`/api/listings/${id}/verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification: "pending" }),
    });
    const body = await readApi<ListingCard>(response);
    if (!response.ok || !body.success) {
      setNotice(errorText(body, "Could not request verification"));
      return;
    }
    setReloadKey((value) => value + 1);
  }

  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, reason: form.get("reason") }),
    });
    const body = await readApi<{ id: string }>(response);
    if (!response.ok || !body.success) {
      setNotice(errorText(body, "Could not send the report"));
      return;
    }
    setNotice("Report sent to the admin queue.");
    event.currentTarget.reset();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href={meta.path} className="text-sm font-semibold text-accent">
        Back to {meta.title.toLowerCase()}
      </Link>
      {state === "loading" ? <p className="mt-6 text-muted">Loading...</p> : null}
      {state === "error" ? (
        <p className="mt-6 rounded-md bg-danger-bg px-3 py-2 text-danger" role="alert">
          {message}
        </p>
      ) : null}
      {state === "ready" && listing ? (
        <article className="mt-4">
          <p className="text-sm text-muted">
            {listing.category} · {listing.location.name} · {listing.status}
          </p>
          <h1 className="mt-1 font-display text-4xl">{listing.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {listing.owner.name}, {listing.owner.town}
          </p>
          {type === "material" ? (
            <p className="mt-3 text-sm text-muted">BuildLink ET has not inspected items.</p>
          ) : null}
          {type === "professional" ? (
            <p className="mt-3 text-sm text-muted">
              Review flag: {listing.verification}. BuildLink ET does not certify licenses.
            </p>
          ) : null}
          <p className="mt-4 whitespace-pre-wrap leading-7">{listing.description}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <Facts type={type} listing={listing} />
          </dl>
          {type === "rental" ? (
            <section className="mt-6">
              <h2 className="font-display text-2xl">Confirmed bookings</h2>
              {listing.bookings && listing.bookings.length > 0 ? (
                <ul className="mt-2 grid gap-2">
                  {listing.bookings.map((booking) => (
                    <li key={`${booking.startDate}-${booking.endDate}`} className="rounded-md border border-line px-3 py-2 text-sm">
                      {booking.startDate} to {booking.endDate}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No confirmed bookings yet.</p>
              )}
            </section>
          ) : null}

          {listing.isOwner ? (
            <section className="mt-6 rounded-lg border border-line bg-surface p-4">
              <h2 className="font-display text-2xl">Owner controls</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`${meta.path}/${listing.id}/edit`} className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold">
                  Edit
                </Link>
                <button type="button" onClick={removeListing} className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold">
                  Delete
                </button>
                {listingStatus[type].values
                  .filter((status) => status !== listing.status)
                  .map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateListingStatus(status)}
                      className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
                    >
                      {status}
                    </button>
                  ))}
                {type === "professional" && listing.verification !== "pending" && listing.verification !== "verified" ? (
                  <button type="button" onClick={requestVerification} className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold">
                    Request verification
                  </button>
                ) : null}
              </div>
              <h3 className="mt-5 font-semibold">Incoming for this listing</h3>
              {incoming.length === 0 ? <p className="mt-2 text-sm text-muted">None yet.</p> : null}
              <ul className="mt-2 grid gap-3">
                {incoming.map((item) => (
                  <li key={item.id} className="rounded-md border border-line p-3">
                    <p className="text-sm text-muted">
                      {item.from.name}, {item.from.town} · {item.status}
                      {item.startDate ? ` · ${item.startDate} to ${item.endDate}` : ""}
                    </p>
                    <p className="mt-1 text-sm">{item.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!isFinalRequestStatus(type, item.status)
                        ? requestStatus[type].ownerSets.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateRequest(item.id, status)}
                              className="rounded-md border border-line px-2 py-1 text-sm"
                            >
                              {status}
                            </button>
                          ))
                        : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="mt-6 rounded-lg border border-line bg-surface p-4">
              <h2 className="font-display text-2xl">{meta.request}</h2>
              {signedIn ? (
                <form onSubmit={sendRequest} className="mt-3 grid gap-3">
                  <textarea className={inputClass} name="message" required minLength={2} rows={4} placeholder="Your message" />
                  {type === "rental" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1 text-sm font-semibold">
                        Start
                        <input className={inputClass} type="date" name="startDate" required />
                      </label>
                      <label className="grid gap-1 text-sm font-semibold">
                        End
                        <input className={inputClass} type="date" name="endDate" required />
                      </label>
                    </div>
                  ) : null}
                  {type === "material" ? (
                    <label className="grid gap-1 text-sm font-semibold">
                      Quantity (optional)
                      <input className={inputClass} type="number" min="0.01" step="any" name="quantity" />
                    </label>
                  ) : null}
                  <button type="submit" disabled={pending} className="rounded-md bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-60">
                    {pending ? "Sending..." : meta.request}
                  </button>
                </form>
              ) : (
                <p className="mt-2 text-sm">
                  <Link href="/login" className="font-semibold text-accent">
                    Log in
                  </Link>{" "}
                  to continue. Private contact details stay hidden.
                </p>
              )}
            </section>
          )}

          {signedIn && !listing.isOwner ? (
            <form onSubmit={report} className="mt-6 grid gap-2">
              <h2 className="font-semibold">Report this listing</h2>
              <textarea className={inputClass} name="reason" required minLength={5} rows={3} placeholder="What is wrong?" />
              <button type="submit" className="w-fit rounded-md border border-line px-3 py-1.5 text-sm font-semibold">
                Report
              </button>
            </form>
          ) : null}
          {notice ? <p className="mt-4 rounded-md border border-line bg-surface px-3 py-2 text-sm">{notice}</p> : null}
        </article>
      ) : null}
    </div>
  );
}

function Facts({ type, listing }: { type: ListingType; listing: ListingCard }) {
  const rows = factRows(type, listing.details);
  return rows.map((row) => (
    <div key={row.label}>
      <dt className="text-muted">{row.label}</dt>
      <dd>{row.value}</dd>
    </div>
  ));
}

function factRows(type: ListingType, details: Record<string, unknown>) {
  if (type === "job") {
    return [
      { label: "Experience", value: detailText(details, "experienceLevel") },
      { label: "Employment", value: detailText(details, "employmentType") },
      {
        label: "Salary",
        value: details.salaryNegotiable ? "Negotiable" : `${detailText(details, "salaryAmount")} ETB`,
      },
      { label: "Deadline", value: detailText(details, "applicationDeadline") || "None" },
      { label: "Skills", value: detailText(details, "skills") || "None listed" },
    ];
  }
  if (type === "material") {
    return [
      { label: "Condition", value: detailText(details, "condition") },
      { label: "Quantity", value: `${detailText(details, "quantity")} ${detailText(details, "unit")}` },
      { label: "Price", value: `${detailText(details, "price")} ETB${details.negotiable ? " (negotiable)" : ""}` },
      { label: "Delivery", value: detailText(details, "deliveryOption") },
    ];
  }
  if (type === "rental") {
    return [
      { label: "Price", value: `${detailText(details, "price")} ETB / ${detailText(details, "pricePeriod")}` },
      { label: "Condition", value: detailText(details, "condition") },
      { label: "Operator", value: details.operatorIncluded ? "Included" : "Not included" },
    ];
  }
  return [
    { label: "Headline", value: detailText(details, "headline") },
    { label: "Profession", value: detailText(details, "profession") },
    { label: "Availability", value: detailText(details, "availability") },
    { label: "Skills", value: detailText(details, "skills") || "None listed" },
  ];
}
