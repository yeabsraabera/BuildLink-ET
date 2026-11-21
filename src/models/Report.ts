import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, required: true, enum: ["listing", "user", "request"] },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, required: true, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

export const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
