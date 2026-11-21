import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFrame } from "@/components/auth-frame";
import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/paths";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <AuthFrame title="Log in" subtitle="Use the account you registered with.">
      <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
        <LoginFormLoader searchParams={searchParams} />
      </Suspense>
    </AuthFrame>
  );
}

async function LoginFormLoader({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <LoginForm nextPath={safeNextPath(params.next)} />;
}
