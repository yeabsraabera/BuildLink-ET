import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/paths";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl">Login</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Use the account you registered with.</p>
      <div className="rounded-xl border border-line bg-card p-5">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <LoginFormLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginFormLoader({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <LoginForm nextPath={safeNextPath(params.next)} />;
}
