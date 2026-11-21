import { ListingForm } from "@/components/listing-form";

export default async function EditProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingForm type="professional" mode="edit" id={id} />;
}