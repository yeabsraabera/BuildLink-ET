import { Suspense } from "react";

import { ListingBrowser } from "@/components/listing-browser";

export default function MaterialsPage() {
  return (
    <Suspense fallback={<p className="mx-auto w-full max-w-5xl px-4 py-10">Loading materials...</p>}>
      <ListingBrowser type="material" />
    </Suspense>
  );
}
