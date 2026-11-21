import { ListingForm } from "@/components/listing-form";

export default async function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingForm type="rental" mode="edit" id={id} />;
}
