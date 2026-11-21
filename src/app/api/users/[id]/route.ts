import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import mongoose from "mongoose";

import { fail, ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { publicProfile, publicReview, ratingFor } from "@/lib/profile";
import { Listing } from "@/models/Listing";
import { Review } from "@/models/Review";
import { User } from "@/models/User";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  await connection();
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Profile not found", 404);
    await connectDB();
    const user = await User.findById(id).lean();
    if (!user) return fail("Profile not found", 404);

    const objectId = new mongoose.Types.ObjectId(id);
    const [stats, reviews, jobs] = await Promise.all([
      ratingFor(id),
      Review.find({ reviewee: objectId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("reviewer", "name town")
        .lean(),
      Listing.find({ owner: objectId, type: "job", status: "Open" })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("location", "name")
        .lean(),
    ]);

    return ok(
      {
        ...publicProfile(user, stats),
        isSelf: auth.user.id === id,
        reviews: reviews.map(publicReview),
        jobs: jobs.map((job) => ({
          id: String(job._id),
          title: job.title,
          town: (job.location as { name?: string } | null)?.name ?? "",
        })),
      },
      "Profile",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
