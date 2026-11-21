import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import mongoose from "mongoose";

import { fail, ok, readJson, serverError, zodFail } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { dateOnly, publicListing } from "@/lib/serialize";
import { isAllowedListingStatus, isListingType, isPublicListingStatus } from "@/lib/status";
import { listingDetailsSchema, listingPatchSchema } from "@/lib/validators";
import { Listing } from "@/models/Listing";
import { Location } from "@/models/Location";
import { Request } from "@/models/Request";

type Params = { params: Promise<{ id: string }> };

async function loadListing(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Listing.findById(id).populate("owner", "name town").populate("location", "name region zone");
}

export async function GET(_request: Request, { params }: Params) {
  await connection();
  try {
    const { id } = await params;
    await connectDB();
    const listing = await loadListing(id);
    if (!listing) return fail("Listing not found", 404);

    const viewer = await getSessionUser();
    const ownerId = String(listing.owner && "_id" in listing.owner ? listing.owner._id : listing.owner);
    const isOwner = viewer?.id === ownerId;
    const isAdmin = Boolean(viewer?.isAdmin);
    if (
      isListingType(listing.type) &&
      !isPublicListingStatus(listing.type, listing.status) &&
      !isOwner &&
      !isAdmin
    ) {
      return fail("Listing not found", 404);
    }

    const data = publicListing(listing.toObject(), viewer?.id);
    if (listing.type === "rental") {
      const bookings = await Request.find({ listing: listing._id, type: "rental", status: "Approved" })
        .select("startDate endDate")
        .sort({ startDate: 1 })
        .lean();
      return ok(
        {
          ...data,
          bookings: bookings.map((item) => ({
            startDate: dateOnly(item.startDate),
            endDate: dateOnly(item.endDate),
          })),
        },
        "Listing",
      );
    }
    return ok(data, "Listing");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const parsed = listingPatchSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);
    if (Object.keys(parsed.data).length === 0) return fail("Nothing to update", 400);

    const { id } = await params;
    await connectDB();
    const listing = await loadListing(id);
    if (!listing) return fail("Listing not found", 404);
    const ownerId = String(listing.owner && "_id" in listing.owner ? listing.owner._id : listing.owner);
    if (ownerId !== auth.user.id) return fail("Only the owner can edit this listing", 403);
    if (!isListingType(listing.type)) return fail("Unknown listing type", 400);

    const patch = parsed.data;
    if (patch.title) listing.title = patch.title;
    if (patch.description) listing.description = patch.description;
    if (patch.category) listing.category = patch.category;
    if (patch.imageUrl !== undefined) listing.imageUrl = patch.imageUrl || undefined;
    if (patch.locationId) {
      const location = await Location.findOne({ _id: patch.locationId, active: true });
      if (!location) return fail("Choose an active location", 400);
      listing.location = location._id;
    }
    if (patch.details !== undefined) {
      const details = listingDetailsSchema.safeParse({ type: listing.type, details: patch.details });
      if (!details.success) return zodFail(details.error);
      listing.details = details.data.details;
      listing.markModified("details");
    }
    if (patch.status) {
      if (!isAllowedListingStatus(listing.type, patch.status)) {
        return fail("That status is not allowed for this listing", 400);
      }
      listing.status = patch.status;
    }

    await listing.save();
    const saved = await loadListing(id);
    return ok(publicListing(saved!.toObject(), auth.user.id), "Listing updated");
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof Error && error.message.includes("not valid")) return fail(error.message, 400);
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const { id } = await params;
    await connectDB();
    const listing = await loadListing(id);
    if (!listing) return fail("Listing not found", 404);
    const ownerId = String(listing.owner && "_id" in listing.owner ? listing.owner._id : listing.owner);
    if (ownerId !== auth.user.id) return fail("Only the owner can delete this listing", 403);
    listing.status = "Removed";
    await listing.save();
    return ok({ id }, "Listing removed");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
