import { unstable_rethrow } from "next/navigation";

import { created, fail, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { reportSchema } from "@/lib/validators";
import { Listing } from "@/models/Listing";
import { Report } from "@/models/Report";

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const parsed = reportSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    await connectDB();
    const listing = await Listing.findById(parsed.data.listingId).select("_id").lean();
    if (!listing) return fail("Listing not found", 404);

    const report = await Report.create({
      reporter: auth.user.id,
      targetType: "listing",
      targetId: listing._id,
      reason: parsed.data.reason,
      status: "open",
    });
    return created({ id: String(report._id) }, "Report sent");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
