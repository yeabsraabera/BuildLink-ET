import mongoose, { Schema } from "mongoose";

import { assertListingStatus, listingTypes, professionalVerification } from "@/lib/status";

const listingSchema = new Schema(
  {
    type: { type: String, required: true, enum: listingTypes },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    location: { type: Schema.Types.ObjectId, ref: "Location", required: true },
    status: { type: String, required: true },
    imageUrl: { type: String, trim: true },
    details: { type: Schema.Types.Mixed, default: {} },
    verification: {
      type: String,
      enum: professionalVerification.values,
      default: professionalVerification.initial,
    },
    seedKey: { type: String, select: false },
  },
  { timestamps: true },
);

listingSchema.index({ seedKey: 1 }, { unique: true, sparse: true });
listingSchema.index({ type: 1, status: 1, location: 1 });
listingSchema.index({ owner: 1, type: 1 });
listingSchema.index({ category: 1 });

listingSchema.pre("validate", function () {
  assertListingStatus(this.type, this.status);
  if (this.type !== "professional") {
    this.verification = "none";
  }
});

export const Listing = mongoose.models.Listing || mongoose.model("Listing", listingSchema);
