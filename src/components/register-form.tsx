"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const inputClass =
  "w-full rounded-md border border-line bg-background px-3 py-2 text-foreground outline-none focus:border-accent";

type ApiBody = {
  success: boolean;
  message: string;
  errors?: { path: string; message: string }[];
};

type Town = { id: string; name: string; region: string; zone: string };

export function RegisterForm() {
  const router = useRouter();
  const [towns, setTowns] = useState<Town[]>([]);
  const [townsError, setTownsError] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/locations", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as ApiBody & { data?: Town[] };
        if (!response.ok || !body.success) {
          throw new Error(body.message || "Could not load towns");
        }
        return body.data ?? [];
      })
      .then((data) => {
        if (!cancelled) setTowns(data);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setTownsError(reason instanceof Error ? reason.message : "Could not load towns");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          town: form.get("town"),
          phone: form.get("phone") || undefined,
        }),
      });
      const body = (await response.json()) as ApiBody;
      if (!response.ok || !body.success) {
        setError(body.errors?.[0]?.message || body.message || "Could not register");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <label className="grid gap-1 text-sm">
        Name
        <input className={inputClass} name="name" autoComplete="name" required />
      </label>
      <label className="grid gap-1 text-sm">
        Email
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="grid gap-1 text-sm">
        Password
        <input
          className={inputClass}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>
      <label className="grid gap-1 text-sm">
        Town
        <select className={inputClass} name="town" required defaultValue="">
          <option value="" disabled>
            {towns.length === 0 ? "Loading towns..." : "Choose a town"}
          </option>
          {towns.map((town) => (
            <option key={town.id} value={town.name}>
              {town.name}
            </option>
          ))}
        </select>
        {townsError ? <span className="text-danger">{townsError}</span> : null}
      </label>
      <label className="grid gap-1 text-sm">
        Phone (optional)
        <input className={inputClass} name="phone" type="tel" autoComplete="tel" />
      </label>
      <button
        type="submit"
        disabled={pending || towns.length === 0}
        className="rounded-md bg-accent px-4 py-2 text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Register"}
      </button>
      <p className="text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="text-accent">
          Login
        </Link>
      </p>
    </form>
  );
}
