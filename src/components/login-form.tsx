"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { FieldError, fieldErrorMap } from "@/components/field-error";
import { PasswordField } from "@/components/password-field";
import { fieldClass, linkClass, primaryClass } from "@/components/ui";

type ApiBody = {
  success: boolean;
  message: string;
  errors?: { path: string; message: string }[];
};

export function LoginForm({
  nextPath = "/dashboard",
  continueTo,
}: {
  nextPath?: string;
  continueTo?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const nextFields: Record<string, string> = {};
    if (!email) nextFields.email = "Enter your email";
    if (!password) nextFields.password = "Enter your password";
    if (Object.keys(nextFields).length > 0) {
      setFields(nextFields);
      return;
    }
    setFields({});
    setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as ApiBody;
      if (!response.ok || !body.success) {
        const mapped = fieldErrorMap(body.errors);
        setFields(mapped);
        setError(mapped.email || mapped.password ? "" : body.message || "Could not log in");
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

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {continueTo ? (
        <p className="rounded-xl border border-line bg-page px-3 py-2 text-sm">
          Please log in to continue to {continueTo}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <label className="grid min-w-0 gap-1 text-sm">
        Email
        <input
          className={fieldClass}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-invalid={fields.email ? true : undefined}
          aria-describedby={fields.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" error={fields.email} />
      </label>
      <PasswordField name="password" autoComplete="current-password" required error={fields.password} />
      <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
        {pending ? "Logging in..." : "Log in"}
      </button>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link
          href={nextPath === "/dashboard" ? "/register" : `/register?next=${encodeURIComponent(nextPath)}`}
          className={linkClass}
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
