import type { Metadata } from "next";

import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl">Register</h1>
      <p className="mt-2 mb-6 text-sm text-muted">One account for jobs, materials, rentals, and professionals.</p>
      <div className="rounded-xl border border-line bg-card p-5">
        <RegisterForm />
      </div>
    </div>
  );
}
