import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "@/components/register-form";
import { safeNextPath } from "@/lib/paths";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl">Register</h1>
      <p className="mt-2 mb-6 text-sm text-muted">One account for jobs, materials, rentals, and professionals.</p>
      <div className="rounded-xl border border-line bg-card p-5">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <RegisterFormLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function RegisterFormLoader({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <RegisterForm nextPath={safeNextPath(params.next)} />;
}
