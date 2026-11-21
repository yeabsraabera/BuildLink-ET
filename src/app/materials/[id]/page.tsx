import { ListingDetailRoute } from "@/components/listing-route";

export default function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingDetailRoute type="material" params={params} />;
}
