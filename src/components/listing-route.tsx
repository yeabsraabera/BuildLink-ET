import { Suspense } from "react";

import { ListingDetail } from "@/components/listing-detail";
import { ListingForm } from "@/components/listing-form";
import { CardSkeleton } from "@/components/skeleton";
import type { ListingType } from "@/lib/status";

export function ListingDetailRoute({
  type,
  params,
}: {
  type: ListingType;
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <CardSkeleton />
        </div>
      }
    >
      <ResolvedDetail type={type} params={params} />
    </Suspense>
  );
}

async function ResolvedDetail({ type, params }: { type: ListingType; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail type={type} id={id} />;
}

export function ListingEditRoute({
  type,
  params,
}: {
  type: ListingType;
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <CardSkeleton />
        </div>
      }
    >
      <ResolvedEdit type={type} params={params} />
    </Suspense>
  );
}

async function ResolvedEdit({ type, params }: { type: ListingType; params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingForm type={type} mode="edit" id={id} />;
}
