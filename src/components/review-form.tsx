"use client";

import { useState, type FormEvent } from "react";

import { errorText, readApi } from "@/components/api-client";
import { ChoiceField } from "@/components/choice-field";
import { fieldClass, primaryClass } from "@/components/ui";

export function ReviewForm({
  revieweeId,
  listingId,
}: {
  revieweeId: string;
  listingId?: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revieweeId,
          rating: Number(form.get("rating")),
          comment: form.get("comment"),
          listingId,
        }),
      });
      const body = await readApi<{ id: string }>(response);
      if (!response.ok || !body.success) {
        setMessage(errorText(body, "Could not save the review"));
        return;
      }
      setDone(true);
    } catch {
      setMessage("Could not save the review");
    } finally {
      setPending(false);
    }
  }

  if (done) return <p className="text-sm text-muted">Review saved.</p>;

  return (
    <form onSubmit={onSubmit} className="mt-2 grid gap-2">
      <p className="text-sm">Leave a review</p>
      <ChoiceField
        name="rating"
        options={[
          { value: "5", label: "5 stars" },
          { value: "4", label: "4 stars" },
          { value: "3", label: "3 stars" },
          { value: "2", label: "2 stars" },
          { value: "1", label: "1 star" },
        ]}
        defaultValue="5"
        ariaLabel="Rating"
      />
      <textarea className={fieldClass} name="comment" required minLength={5} rows={3} placeholder="How did the work go?" />
      {message ? (
        <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${primaryClass} w-fit`}>
        {pending ? "Saving..." : "Leave a review"}
      </button>
    </form>
  );
}
