import { ListingDetailRoute } from "@/components/listing-route";

export default function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingDetailRoute type="professional" params={params} />;
}
