import { z } from "zod";

import { listingTypes } from "@/lib/status";

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be at most 72 characters"),
  town: z.string().trim().min(2, "Choose a town").max(80),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine((value) => value === undefined || value === "" || value.length >= 7, {
      message: "Phone must be 7 to 20 characters",
    })
    .transform((value) => (value ? value : undefined)),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password").max(72),
});

const experienceLevels = ["entry-level", "junior", "intermediate", "senior"] as const;
const employmentTypes = [
  "permanent",
  "contract",
  "temporary",
  "daily",
  "internship",
  "apprenticeship",
] as const;
const materialConditions = [
  "New and unused",
  "Unused surplus",
  "Reusable / reclaimed",
  "Used, good condition",
  "Used, needs inspection",
  "Damaged / for parts",
] as const;
const deliveryOptions = ["pickup", "delivery", "both"] as const;
const pricePeriods = ["hourly", "daily", "weekly", "monthly"] as const;
const rentalConditions = ["Good", "Fair", "Needs service"] as const;
const availabilityValues = ["Available", "Limited", "Busy"] as const;

const titleField = z.string().trim().min(3).max(120);
const descriptionField = z.string().trim().min(10).max(4000);
const categoryField = z.string().trim().min(2).max(80);
const locationIdField = z.string().trim().regex(/^[a-f\d]{24}$/i, "Choose a location");
const imageUrlField = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\//.test(value), {
    message: "Image URL must start with http:// or https://",
  });

const jobDetails = z.object({
  experienceLevel: z.enum(experienceLevels),
  employmentType: z.enum(employmentTypes),
  salaryNegotiable: z.boolean(),
  salaryAmount: z.number().nonnegative().optional(),
  currency: z.literal("ETB"),
  applicationDeadline: dateText.optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
});

const materialDetails = z.object({
  condition: z.enum(materialConditions),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1).max(20),
  price: z.number().nonnegative(),
  currency: z.literal("ETB"),
  negotiable: z.boolean(),
  deliveryOption: z.enum(deliveryOptions),
});

const rentalDetails = z.object({
  price: z.number().nonnegative(),
  currency: z.literal("ETB"),
  pricePeriod: z.enum(pricePeriods),
  condition: z.enum(rentalConditions),
  operatorIncluded: z.boolean(),
});

const professionalDetails = z.object({
  headline: z.string().trim().min(3).max(120),
  profession: z.string().trim().min(2).max(80),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  availability: z.enum(availabilityValues),
});

const listingBase = {
  title: titleField,
  description: descriptionField,
  category: categoryField,
  locationId: locationIdField,
  imageUrl: imageUrlField,
};

export const listingWriteSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("job"), ...listingBase, details: jobDetails }),
  z.object({ type: z.literal("material"), ...listingBase, details: materialDetails }),
  z.object({ type: z.literal("rental"), ...listingBase, details: rentalDetails }),
  z.object({ type: z.literal("professional"), ...listingBase, details: professionalDetails }),
]);

export const listingDetailsSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("job"), details: jobDetails }),
  z.object({ type: z.literal("material"), details: materialDetails }),
  z.object({ type: z.literal("rental"), details: rentalDetails }),
  z.object({ type: z.literal("professional"), details: professionalDetails }),
]);

export const requestWriteSchema = z
  .object({
    type: z.enum(listingTypes),
    listingId: locationIdField,
    message: z.string().trim().min(2).max(2000),
    startDate: dateText.optional(),
    endDate: dateText.optional(),
    quantity: z.number().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endDate must be on or after startDate",
      });
    }
    if (value.type === "rental" && (!value.startDate || !value.endDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "A rental request needs a start date and an end date",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
