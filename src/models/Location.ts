import mongoose, { Schema } from "mongoose";

const locationSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    region: { type: String, required: true, trim: true },
    zone: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Location = mongoose.models.Location || mongoose.model("Location", locationSchema);
