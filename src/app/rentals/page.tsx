import { Suspense } from "react";

import { ListingBrowser } from "@/components/listing-browser";
import { ListingGridSkeleton } from "@/components/skeleton";

export default function RentalsPage() {
  return (
    <Suspense fallback={<ListingGridSkeleton label="rentals" />}>
      <ListingBrowser type="rental" />
    </Suspense>
  );
}
