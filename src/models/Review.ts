import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    relatedListing: { type: Schema.Types.ObjectId, ref: "Listing" },
    relatedRequest: { type: Schema.Types.ObjectId, ref: "Request", required: true },
    seedKey: { type: String, select: false },
  },
  { timestamps: true },
);

reviewSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

reviewSchema.index({ reviewer: 1, relatedRequest: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
