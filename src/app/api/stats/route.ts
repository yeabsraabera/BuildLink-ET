import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Listing } from "@/models/Listing";

export async function GET() {
  await connection();
  try {
    await connectDB();
    const [jobs, contractors, materials, equipment] = await Promise.all([
      Listing.countDocuments({ type: "job", status: "Open" }),
      Listing.countDocuments({ type: "professional", status: "Active" }),
      Listing.countDocuments({ type: "material", status: { $in: ["Available", "Reserved"] } }),
      Listing.countDocuments({ type: "rental", status: "Available" }),
    ]);
    return ok({ jobs, contractors, materials, equipment }, "Stats");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
