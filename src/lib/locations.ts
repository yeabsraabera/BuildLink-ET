import { connectDB } from "@/lib/db";
import { Location } from "@/models/Location";

export type TownOption = {
  id: string;
  name: string;
  region: string;
  zone: string;
};

export async function listTowns(): Promise<TownOption[]> {
  await connectDB();
  const locations = await Location.find({ active: true }).sort({ name: 1 }).lean();
  return locations.map((location) => ({
    id: String(location._id),
    name: location.name,
    region: location.region,
    zone: location.zone,
  }));
}
