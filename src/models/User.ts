import mongoose, { Schema } from "mongoose";

import { paymentMethodIds } from "@/lib/payments";

const experienceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    years: { type: String, required: true, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    town: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["contractor", "employer", "both"],
      default: "both",
    },
    headline: { type: String, trim: true, maxlength: 120 },
    bio: { type: String, trim: true, maxlength: 2000 },
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    avatarUrl: { type: String, trim: true },
    paymentMethods: { type: [String], enum: paymentMethodIds, default: [] },
    isAdmin: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  { timestamps: true },
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}
export const User = mongoose.model("User", userSchema);
