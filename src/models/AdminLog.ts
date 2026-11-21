import mongoose, { Schema } from "mongoose";

const adminLogSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    targetType: { type: String, trim: true },
    targetId: { type: Schema.Types.ObjectId },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

adminLogSchema.index({ admin: 1, createdAt: -1 });

export const AdminLog = mongoose.models.AdminLog || mongoose.model("AdminLog", adminLogSchema);
