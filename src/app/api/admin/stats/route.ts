import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireAdmin, writeAdminLog } from "@/lib/guards";
import { Listing } from "@/models/Listing";
import { Report } from "@/models/Report";
import { Request } from "@/models/Request";
import { User } from "@/models/User";

export async function GET() {
  await connection();
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    await connectDB();

    const [users, listings, requests, openReports, pendingVerifications, byType] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments({ status: { $ne: "Removed" } }),
      Request.countDocuments(),
      Report.countDocuments({ status: "open" }),
      Listing.countDocuments({ type: "professional", verification: "pending", status: { $ne: "Removed" } }),
      Listing.aggregate<{ _id: string; count: number }>([
        { $match: { status: { $ne: "Removed" } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const counts = Object.fromEntries(byType.map((item) => [item._id, item.count]));
    await writeAdminLog({ adminId: auth.user.id, action: "view stats" });
    return ok(
      {
        users,
        listings,
        requests,
        openReports,
        pendingVerifications,
        jobs: counts.job ?? 0,
        materials: counts.material ?? 0,
        rentals: counts.rental ?? 0,
        professionals: counts.professional ?? 0,
      },
      "Stats",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
