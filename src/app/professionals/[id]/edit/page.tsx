import { ListingEditRoute } from "@/components/listing-route";

export default function EditProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingEditRoute type="professional" params={params} />;
}