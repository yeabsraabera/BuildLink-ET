import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="font-display text-3xl">Login</h1>
      <p className="mt-2 mb-6 text-muted">Use the account you registered with.</p>
      <div className="rounded-lg border border-line bg-surface p-5">
        <LoginForm />
      </div>
    </div>
  );
}
