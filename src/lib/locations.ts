import { connectDB } from "@/lib/db";
import { Location } from "@/models/Location";

export type TownOption = {
  id: string;
  name: string;
  region: string;
  zone: string;
};

function toTown(location: { _id: unknown; name: string; region: string; zone: string }): TownOption {
  return {
    id: String(location._id),
    name: location.name,
    region: location.region,
    zone: location.zone,
  };
}

export async function listTowns(): Promise<TownOption[]> {
  await connectDB();
  const locations = await Location.find({ active: true }).sort({ name: 1 }).lean();
  return locations.map((location) => toTown(location));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function ensureTown(name: string): Promise<TownOption | null> {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 80) return null;
  await connectDB();
  const existing = await Location.findOne({
    name: { $regex: `^${escapeRegex(trimmed)}$`, $options: "i" },
  });
  if (existing) {
    if (!existing.active) {
      existing.active = true;
      await existing.save();
    }
    return toTown(existing);
  }
  try {
    const created = await Location.create({
      name: trimmed,
      region: "Southwest Ethiopia",
      zone: "Other",
      active: true,
    });
    return toTown(created);
  } catch (error) {
    const duplicate =
      typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
    if (!duplicate) throw error;
    const again = await Location.findOne({ name: trimmed });
    return again ? toTown(again) : null;
  }
}
