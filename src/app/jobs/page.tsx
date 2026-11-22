import { Suspense } from "react";

import { ListingBrowser } from "@/components/listing-browser";
import { ListingGridSkeleton } from "@/components/skeleton";

export default function JobsPage() {
  return (
    <Suspense fallback={<ListingGridSkeleton label="jobs" />}>
      <ListingBrowser type="job" />
    </Suspense>
  );
}
