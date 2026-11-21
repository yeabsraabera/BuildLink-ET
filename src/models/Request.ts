import mongoose, { Schema } from "mongoose";

import { assertRequestStatus, listingTypes, requestStatus } from "@/lib/status";

const requestSchema = new Schema(
  {
    type: { type: String, required: true, enum: listingTypes },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    startDate: { type: Date },
    endDate: { type: Date },
    quantity: { type: Number },
    proposedFee: { type: Number },
    status: { type: String, required: true },
    seedKey: { type: String, select: false },
  },
  { timestamps: true },
);

requestSchema.index(
  { listing: 1, from: 1 },
  {
    unique: true,
    name: "one_active_job_application",
    partialFilterExpression: {
      type: "job",
      status: { $in: [...requestStatus.job.active] },
    },
  },
);
requestSchema.index({ seedKey: 1 }, { unique: true, sparse: true });
requestSchema.index({ from: 1, createdAt: -1 });
requestSchema.index({ to: 1, createdAt: -1 });
requestSchema.index({ listing: 1, status: 1, startDate: 1, endDate: 1 });

requestSchema.pre("validate", function () {
  assertRequestStatus(this.type, this.status);
  if (this.from.toString() === this.to.toString()) {
    throw new Error("You cannot request or apply on your own listing");
  }
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    throw new Error("endDate must be on or after startDate");
  }
});

export const Request = mongoose.models.Request || mongoose.model("Request", requestSchema);
