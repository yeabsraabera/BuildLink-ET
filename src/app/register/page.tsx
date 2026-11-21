import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { AuthFrame } from "@/components/auth-frame";
import { RegisterForm } from "@/components/register-form";
import { listTowns, type TownOption } from "@/lib/locations";
import { safeNextPath } from "@/lib/paths";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <AuthFrame
      title="Create a free account"
      subtitle="One account for jobs, materials, rentals, and professionals."
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading towns...</p>}>
        <RegisterFormLoader searchParams={searchParams} />
      </Suspense>
    </AuthFrame>
  );
}

async function RegisterFormLoader({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await connection();
  const params = await searchParams;
  let towns: TownOption[] = [];
  let townsError = "";
  try {
    towns = await listTowns();
    if (towns.length === 0) townsError = "No towns are available yet.";
  } catch {
    townsError = "Could not load towns.";
  }
  return (
    <RegisterForm nextPath={safeNextPath(params.next)} initialTowns={towns} initialError={townsError} />
  );
}
