import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireAdmin, writeAdminLog } from "@/lib/guards";
import { publicListing } from "@/lib/serialize";
import { Listing } from "@/models/Listing";

export async function GET() {
  await connection();
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    await connectDB();
    const items = await Listing.find({ status: { $ne: "Removed" } })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate("owner", "name town")
      .populate("location", "name region zone")
      .lean();
    await writeAdminLog({ adminId: auth.user.id, action: "view listings" });
    return ok(
      items.map((item) => publicListing(item, auth.user.id)),
      "Listings",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
