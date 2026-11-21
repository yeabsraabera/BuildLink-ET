import { ListingEditRoute } from "@/components/listing-route";

export default function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingEditRoute type="material" params={params} />;
}
