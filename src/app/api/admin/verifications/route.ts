import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import mongoose from "mongoose";

import { fail, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireAdmin, writeAdminLog } from "@/lib/guards";
import { publicListing } from "@/lib/serialize";
import { adminVerificationSchema } from "@/lib/validators";
import { Listing } from "@/models/Listing";

export async function GET() {
  await connection();
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    await connectDB();
    const items = await Listing.find({
      type: "professional",
      verification: "pending",
      status: { $ne: "Removed" },
    })
      .sort({ updatedAt: -1 })
      .populate("owner", "name town")
      .populate("location", "name region zone")
      .lean();
    await writeAdminLog({ adminId: auth.user.id, action: "view verification queue" });
    return ok(
      items.map((item) => publicListing(item, auth.user.id)),
      "Verification queue",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    const parsed = adminVerificationSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);
    if (!mongoose.isValidObjectId(parsed.data.listingId)) return fail("Listing not found", 404);

    await connectDB();
    const listing = await Listing.findById(parsed.data.listingId);
    if (!listing || listing.type !== "professional") return fail("Listing not found", 404);
    listing.verification = parsed.data.verification;
    await listing.save();
    await writeAdminLog({
      adminId: auth.user.id,
      action: `verification ${parsed.data.verification}`,
      targetType: "listing",
      targetId: String(listing._id),
    });
    return ok({ id: String(listing._id), verification: listing.verification }, "Verification updated");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
