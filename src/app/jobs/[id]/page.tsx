import { ListingDetailRoute } from "@/components/listing-route";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingDetailRoute type="job" params={params} />;
}
