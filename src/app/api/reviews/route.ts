import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import mongoose from "mongoose";

import { created, fail, isDuplicateKey, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { publicReview } from "@/lib/profile";
import { reviewWriteSchema } from "@/lib/validators";
import { Request } from "@/models/Request";
import { Review } from "@/models/Review";
import { User } from "@/models/User";

export async function GET(request: Request) {
  await connection();
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId || !mongoose.isValidObjectId(userId)) return fail("Choose a profile", 400);
    await connectDB();
    const reviews = await Review.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("reviewer", "name town")
      .lean();
    return ok(reviews.map(publicReview), "Reviews");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const parsed = reviewWriteSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);
    if (parsed.data.revieweeId === auth.user.id) {
      return fail("You cannot review yourself", 403);
    }

    await connectDB();
    const reviewee = await User.findById(parsed.data.revieweeId).select("_id").lean();
    if (!reviewee) return fail("Profile not found", 404);

    const filter: Record<string, unknown> = {
      type: "job",
      status: "Accepted",
      $or: [
        { from: auth.user.id, to: parsed.data.revieweeId },
        { from: parsed.data.revieweeId, to: auth.user.id },
      ],
    };
    if (parsed.data.listingId) filter.listing = parsed.data.listingId;
    const accepted = await Request.findOne(filter).sort({ updatedAt: -1 });
    if (!accepted) {
      return fail("You can only review someone after an accepted job application", 403);
    }

    const existing = await Review.findOne({ reviewer: auth.user.id, relatedRequest: accepted._id }).lean();
    if (existing) return fail("You already reviewed this job", 409);

    const review = await Review.create({
      reviewer: auth.user.id,
      reviewee: parsed.data.revieweeId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      relatedListing: parsed.data.listingId ?? accepted.listing,
      relatedRequest: accepted._id,
    });
    const saved = await Review.findById(review._id).populate("reviewer", "name town").lean();
    return created(publicReview(saved!), "Review saved");
  } catch (error) {
    unstable_rethrow(error);
    if (isDuplicateKey(error)) return fail("You already reviewed this job", 409);
    return serverError(error);
  }
}
