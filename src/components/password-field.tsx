"use client";

import { useState } from "react";

import { fieldClass } from "@/components/ui";

export function PasswordField({
  name = "password",
  autoComplete,
  placeholder,
  minLength,
  required,
  error,
}: {
  name?: string;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className="grid min-w-0 gap-1 text-sm">
      <span>Password</span>
      <div className="relative min-w-0">
        <input
          className={`${fieldClass} pr-16`}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-teal"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
