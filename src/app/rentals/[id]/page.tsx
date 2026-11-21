import { ListingDetailRoute } from "@/components/listing-route";

export default function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingDetailRoute type="rental" params={params} />;
}
