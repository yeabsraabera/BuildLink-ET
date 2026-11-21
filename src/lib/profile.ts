import mongoose from "mongoose";

import { toPublicOwner } from "@/lib/auth";
import { Review } from "@/models/Review";

type Experience = {
  title?: string;
  company?: string;
  years?: string;
  description?: string;
};

export function publicProfile(
  user: {
    _id: unknown;
    name: string;
    town: string;
    role?: string;
    headline?: string;
    bio?: string;
    skills?: string[];
    experience?: Experience[];
    avatarUrl?: string;
  },
  stats: { average: number; count: number },
) {
  return {
    id: String(user._id),
    name: user.name,
    town: user.town,
    role: user.role ?? "both",
    headline: user.headline ?? "",
    bio: user.bio ?? "",
    skills: user.skills ?? [],
    experience: (user.experience ?? []).map((item) => ({
      title: item.title ?? "",
      company: item.company ?? "",
      years: item.years ?? "",
      description: item.description ?? "",
    })),
    avatarUrl: user.avatarUrl || undefined,
    rating: stats.average,
    reviewCount: stats.count,
  };
}

export function publicReview(review: {
  _id: unknown;
  rating: number;
  comment: string;
  createdAt?: Date;
  reviewer?: unknown;
}) {
  const raw = review.reviewer as { _id?: unknown; name?: string; town?: string } | null;
  const reviewer = toPublicOwner({
    _id: raw?._id,
    name: raw?.name ?? "Unknown",
    town: raw?.town ?? "",
  });
  return {
    id: String(review._id),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : undefined,
    reviewer,
  };
}

export async function ratingFor(userId: string) {
  const rows = await Review.aggregate<{ _id: null; average: number; count: number }>([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const row = rows[0];
  if (!row) return { average: 0, count: 0 };
  return { average: Math.round(row.average * 10) / 10, count: row.count };
}
