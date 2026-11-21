import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { created, fail, isDuplicateKey, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { parseDateOnly, publicRequest } from "@/lib/serialize";
import { isPublicListingStatus, requestStatus } from "@/lib/status";
import { requestWriteSchema } from "@/lib/validators";
import { Listing } from "@/models/Listing";
import { Request } from "@/models/Request";

export async function GET(request: Request) {
  await connection();
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const box = new URL(request.url).searchParams.get("box");
    if (box !== "incoming" && box !== "outgoing") {
      return fail("Use box=incoming or box=outgoing", 400);
    }

    await connectDB();
    const filter = box === "incoming" ? { to: auth.user.id } : { from: auth.user.id };
    const items = await Request.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("listing", "title type status")
      .populate("from", "name town")
      .populate("to", "name town")
      .lean();

    return ok(
      items.map((item) => publicRequest(item, auth.user.id)),
      box === "incoming" ? "Incoming requests" : "Your requests",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const parsed = requestWriteSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    await connectDB();
    const listing = await Listing.findById(parsed.data.listingId);
    if (!listing) return fail("Listing not found", 404);
    if (listing.type !== parsed.data.type) return fail("Request type does not match the listing", 400);
    if (!isPublicListingStatus(listing.type, listing.status)) {
      return fail("This listing is not open for requests", 400);
    }
    if (String(listing.owner) === auth.user.id) {
      return fail("You cannot request or apply on your own listing", 400);
    }

    const createdRequest = await Request.create({
      type: parsed.data.type,
      listing: listing._id,
      from: auth.user.id,
      to: listing.owner,
      message: parsed.data.message,
      startDate: parsed.data.startDate ? parseDateOnly(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? parseDateOnly(parsed.data.endDate) : undefined,
      quantity: parsed.data.quantity,
      proposedFee: parsed.data.proposedFee,
      status: requestStatus[parsed.data.type].initial,
    });

    const saved = await Request.findById(createdRequest._id)
      .populate("listing", "title type status")
      .populate("from", "name town")
      .populate("to", "name town")
      .lean();
    return created(publicRequest(saved!, auth.user.id), "Request sent");
  } catch (error) {
    unstable_rethrow(error);
    if (isDuplicateKey(error)) return fail("You already have an active application for this job", 409);
    if (error instanceof Error && error.message.includes("cannot request")) {
      return fail(error.message, 400);
    }
    return serverError(error);
  }
}
