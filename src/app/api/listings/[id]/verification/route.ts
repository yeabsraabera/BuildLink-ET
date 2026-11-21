import { unstable_rethrow } from "next/navigation";
import mongoose from "mongoose";

import { fail, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { publicListing } from "@/lib/serialize";
import { ownerVerificationSchema } from "@/lib/validators";
import { Listing } from "@/models/Listing";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const parsed = ownerVerificationSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Listing not found", 404);
    await connectDB();
    const listing = await Listing.findById(id);
    if (!listing) return fail("Listing not found", 404);
    if (String(listing.owner) !== auth.user.id) return fail("Only the owner can request verification", 403);
    if (listing.type !== "professional") return fail("Only professional profiles can be reviewed", 400);
    if (listing.verification === "verified") return fail("This profile is already reviewed", 400);

    listing.verification = "pending";
    await listing.save();
    const saved = await Listing.findById(id)
      .populate("owner", "name town")
      .populate("location", "name region zone")
      .lean();
    return ok(publicListing(saved!, auth.user.id), "Verification requested");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
