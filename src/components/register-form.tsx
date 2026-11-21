"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { ChoiceField } from "@/components/choice-field";
import { fieldClass, linkClass, primaryClass } from "@/components/ui";
import type { TownOption } from "@/lib/locations";

const inputClass = fieldClass;

type ApiBody = {
  success: boolean;
  message: string;
  errors?: { path: string; message: string }[];
};

export function RegisterForm({
  nextPath = "/dashboard",
  initialTowns = [],
  initialError = "",
}: {
  nextPath?: string;
  initialTowns?: TownOption[];
  initialError?: string;
}) {
  const router = useRouter();
  const [towns, setTowns] = useState<TownOption[]>(initialTowns);
  const [townsError, setTownsError] = useState(initialError);
  const [loadingTowns, setLoadingTowns] = useState(initialTowns.length === 0 && !initialError);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (initialTowns.length > 0) return;
    void loadTowns();
    // The server list is the normal path. This only runs when that list was empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTowns() {
    setLoadingTowns(true);
    setTownsError("");
    try {
      const response = await fetch("/api/locations", { cache: "no-store" });
      const body = (await response.json()) as ApiBody & { data?: TownOption[] };
      if (!response.ok || !body.success || !Array.isArray(body.data) || body.data.length === 0) {
        throw new Error(body.message || "Could not load towns");
      }
      setTowns(body.data);
    } catch (reason: unknown) {
      setTownsError(reason instanceof Error ? reason.message : "Could not load towns");
    } finally {
      setLoadingTowns(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const town = String(form.get("town") || "").trim();
    if (town.length < 2) {
      setError("Choose a town, or type one under Other");
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          town,
          phone: form.get("phone") || undefined,
        }),
      });
      const body = (await response.json()) as ApiBody;
      if (!response.ok || !body.success) {
        setError(body.errors?.[0]?.message || body.message || "Could not register");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  const loginHref = nextPath === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error ? (
        <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <label className="grid min-w-0 gap-1 text-sm">
        Name
        <input className={inputClass} name="name" autoComplete="name" required placeholder="Your name" />
      </label>
      <label className="grid min-w-0 gap-1 text-sm">
        Email
        <input className={inputClass} name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <label className="grid min-w-0 gap-1 text-sm">
        Password
        <input
          className={inputClass}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          placeholder="At least 6 characters"
        />
      </label>
      <div className="grid min-w-0 gap-1 text-sm">
        <span>Town</span>
        <ChoiceField
          key={towns.map((item) => item.id).join(",") || "towns"}
          name="town"
          options={towns.map((item) => ({ value: item.name, label: `${item.name}, ${item.region}` }))}
          defaultValue={towns[0]?.name ?? ""}
          allowOther
          placeholder={loadingTowns ? "Loading towns..." : "Choose a town"}
          ariaLabel="Town"
        />
        {townsError ? (
          <span className="text-danger">
            {townsError}{" "}
            <button type="button" className={linkClass} onClick={() => void loadTowns()}>
              Retry
            </button>
          </span>
        ) : null}
      </div>
      <label className="grid min-w-0 gap-1 text-sm">
        Phone (optional)
        <input className={inputClass} name="phone" type="tel" autoComplete="tel" placeholder="09..." />
      </label>
      <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
        {pending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-sm text-muted">
        Already registered?{" "}
        <Link href={loginHref} className={linkClass}>
          Log in
        </Link>
      </p>
    </form>
  );
}
