import { ListingForm } from "@/components/listing-form";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingForm type="material" mode="edit" id={id} />;
}
