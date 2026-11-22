import { Suspense } from "react";

import { ListingBrowser } from "@/components/listing-browser";
import { ListingGridSkeleton } from "@/components/skeleton";

export default function MaterialsPage() {
  return (
    <Suspense fallback={<ListingGridSkeleton label="materials" />}>
      <ListingBrowser type="material" />
    </Suspense>
  );
}
