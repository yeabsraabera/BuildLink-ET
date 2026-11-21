import type { Metadata } from "next";

import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="font-display text-3xl">Register</h1>
      <p className="mt-2 mb-6 text-muted">One account for jobs, materials, rentals, and professionals.</p>
      <div className="rounded-lg border border-line bg-surface p-5">
        <RegisterForm />
      </div>
    </div>
  );
}
