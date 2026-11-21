import { ListingDetail } from "@/components/listing-detail";

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail type="material" id={id} />;
}
