import { unstable_rethrow } from "next/navigation";
import mongoose from "mongoose";

import { fail, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireAdmin, writeAdminLog } from "@/lib/guards";
import { adminRemoveSchema } from "@/lib/validators";
import { Listing } from "@/models/Listing";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    const parsed = adminRemoveSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Listing not found", 404);
    await connectDB();
    const listing = await Listing.findById(id);
    if (!listing) return fail("Listing not found", 404);
    listing.status = "Removed";
    await listing.save();
    await writeAdminLog({
      adminId: auth.user.id,
      action: "remove listing",
      targetType: "listing",
      targetId: String(listing._id),
      note: listing.title,
    });
    return ok({ id: String(listing._id), status: listing.status }, "Listing removed");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
