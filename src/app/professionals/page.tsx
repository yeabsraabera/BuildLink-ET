import { Suspense } from "react";

import { ListingBrowser } from "@/components/listing-browser";
import { ListingGridSkeleton } from "@/components/skeleton";

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={<ListingGridSkeleton label="professionals" />}>
      <ListingBrowser type="professional" />
    </Suspense>
  );
}
