import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl">Login</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Use the account you registered with.</p>
      <div className="rounded-xl border border-line bg-card p-5">
        <LoginForm />
      </div>
    </div>
  );
}
