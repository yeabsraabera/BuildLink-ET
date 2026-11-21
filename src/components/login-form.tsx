"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { fieldClass, linkClass, primaryClass } from "@/components/ui";

const inputClass = fieldClass;

type ApiBody = {
  success: boolean;
  message: string;
  errors?: { path: string; message: string }[];
};

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const body = (await response.json()) as ApiBody;
      if (!response.ok || !body.success) {
        setError(body.errors?.[0]?.message || body.message || "Could not log in");
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
        <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <label className="grid min-w-0 gap-1 text-sm">
        Email
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="grid min-w-0 gap-1 text-sm">
        Password
        <input
          className={inputClass}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className={primaryClass}
      >
        {pending ? "Logging in..." : "Login"}
      </button>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/register" className={linkClass}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
