import { unstable_rethrow } from "next/navigation";
import mongoose from "mongoose";

import { fail, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { publicRequest } from "@/lib/serialize";
import { isListingType, listingStatusAfterRequest, requestActorMaySet } from "@/lib/status";
import { requestStatusSchema } from "@/lib/validators";
import { Listing } from "@/models/Listing";
import { Request } from "@/models/Request";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const parsed = requestStatusSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Request not found", 404);
    await connectDB();
    const item = await Request.findById(id);
    if (!item || !isListingType(item.type)) return fail("Request not found", 404);

    const actor = String(item.from) === auth.user.id ? "from" : String(item.to) === auth.user.id ? "to" : null;
    if (!actor) return fail("You cannot update this request", 403);
    if (!requestActorMaySet(item.type, item.status, parsed.data.status, actor)) {
      return fail("That status change is not allowed", 400);
    }

    if (item.type === "rental" && parsed.data.status === "Approved") {
      const overlap = await Request.findOne({
        _id: { $ne: item._id },
        listing: item.listing,
        type: "rental",
        status: "Approved",
        startDate: { $lte: item.endDate },
        endDate: { $gte: item.startDate },
      }).lean();
      if (overlap) return fail("Those dates overlap an approved booking", 409);
    }

    item.status = parsed.data.status;
    await item.save();

    const nextListingStatus = listingStatusAfterRequest(item.type, parsed.data.status);
    if (nextListingStatus) {
      const listing = await Listing.findById(item.listing);
      if (listing) {
        listing.status = nextListingStatus;
        await listing.save();
      }
    }

    const saved = await Request.findById(item._id)
      .populate("listing", "title type status")
      .populate("from", "name town")
      .populate("to", "name town")
      .lean();
    return ok(publicRequest(saved!, auth.user.id), "Request updated");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
