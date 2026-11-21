import type { ListingType } from "@/lib/status";

export const moduleMeta: Record<
  ListingType,
  {
    path: string;
    title: string;
    post: string;
    empty: string;
    request: string;
    categories: string[];
  }
> = {
  job: {
    path: "/jobs",
    title: "Jobs",
    post: "Post a job",
    empty: "No open jobs match that search.",
    request: "Apply",
    categories: ["Civil engineering", "Masonry", "Electrical installation", "Site supervision", "Carpentry"],
  },
  material: {
    path: "/materials",
    title: "Materials",
    post: "List material",
    empty: "No materials match that search.",
    request: "Send inquiry",
    categories: [
      "Tiles and ceramics",
      "Cement and dry construction mixtures",
      "Doors and windows",
      "Steel and rebar",
      "Timber",
    ],
  },
  rental: {
    path: "/rentals",
    title: "Rentals",
    post: "List equipment",
    empty: "No equipment matches that search.",
    request: "Request these dates",
    categories: ["Concrete mixers", "Generators", "Scaffolding", "Hand tools", "Vehicles"],
  },
  professional: {
    path: "/professionals",
    title: "Professionals",
    post: "Publish your profile",
    empty: "No professionals match that search.",
    request: "Send inquiry",
    categories: ["Civil engineering", "Masonry", "Site supervision", "Electrical installation", "Carpentry"],
  },
};

export const jobExperience = ["entry-level", "junior", "intermediate", "senior"] as const;
export const jobEmployment = [
  "permanent",
  "contract",
  "temporary",
  "daily",
  "internship",
  "apprenticeship",
] as const;
export const materialConditions = [
  "New and unused",
  "Unused surplus",
  "Reusable / reclaimed",
  "Used, good condition",
  "Used, needs inspection",
  "Damaged / for parts",
] as const;
export const deliveryOptions = ["pickup", "delivery", "both"] as const;
export const pricePeriods = ["hourly", "daily", "weekly", "monthly"] as const;
export const rentalConditions = ["Good", "Fair", "Needs service"] as const;
export const availabilityValues = ["Available", "Limited", "Busy"] as const;
export const payTypes = ["fixed fee", "per day", "per month", "negotiable"] as const;
