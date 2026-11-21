import { ListingDetail } from "@/components/listing-detail";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail type="job" id={id} />;
}
