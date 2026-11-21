import { ListingForm } from "@/components/listing-form";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingForm type="job" mode="edit" id={id} />;
}