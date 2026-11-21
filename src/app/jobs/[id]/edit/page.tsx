import { ListingEditRoute } from "@/components/listing-route";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingEditRoute type="job" params={params} />;
}
