import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Location } from "@/models/Location";

export async function GET() {
  await connection();
  try {
    await connectDB();
    const locations = await Location.find({ active: true }).sort({ name: 1 }).lean();
    return ok(
      locations.map((location) => ({
        id: String(location._id),
        name: location.name,
        region: location.region,
        zone: location.zone,
      })),
      "Locations",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
