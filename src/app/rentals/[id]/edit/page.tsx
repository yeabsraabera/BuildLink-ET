import { ListingEditRoute } from "@/components/listing-route";

export default function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingEditRoute type="rental" params={params} />;
}
