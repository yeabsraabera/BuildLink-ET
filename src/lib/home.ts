import { connectDB } from "@/lib/db";
import { Listing } from "@/models/Listing";

export type HomeStats = {
  jobs: number;
  contractors: number;
  materials: number;
  equipment: number;
};

export type HomeContractor = {
  id: string;
  listingId: string;
  name: string;
  town: string;
  trade: string;
  skills: string[];
  photo?: string;
  rating: number;
  reviewCount: number;
};

export type HomeJob = {
  id: string;
  title: string;
  town: string;
  pay: string;
  employmentType: string;
};

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") return {} as Record<string, unknown>;
  return value as Record<string, unknown>;
}

export function payLabel(details: Record<string, unknown>) {
  const payType = String(details.payType || "");
  const currency = "ETB";
  if (payType === "negotiable" || details.salaryNegotiable === true) return "Negotiable";
  const min = Number(details.payMin);
  const max = Number(details.payMax);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
    return `${min} to ${max} ${currency}`;
  }
  const amount = Number(details.payAmount ?? details.salaryAmount);
  if (Number.isFinite(amount) && amount > 0) {
    if (payType === "per day") return `${amount} ${currency} per day`;
    if (payType === "per month") return `${amount} ${currency} per month`;
    return `${amount} ${currency}`;
  }
  return "Pay listed on the job";
}

export async function loadHomeContent() {
  await connectDB();
  const [jobs, contractors, materials, equipment, people, latest] = await Promise.all([
    Listing.countDocuments({ type: "job", status: "Open" }),
    Listing.countDocuments({ type: "professional", status: "Active" }),
    Listing.countDocuments({ type: "material", status: { $in: ["Available", "Reserved"] } }),
    Listing.countDocuments({ type: "rental", status: "Available" }),
    Listing.find({ type: "professional", status: "Active" })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("owner", "name town avatarUrl")
      .populate("location", "name")
      .lean(),
    Listing.find({ type: "job", status: "Open" })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("location", "name")
      .lean(),
  ]);

  return {
    stats: { jobs, contractors, materials, equipment } satisfies HomeStats,
    contractors: people.map((item) => {
      const details = asRecord(item.details);
      const owner = asRecord(item.owner);
      const location = asRecord(item.location);
      const skills = Array.isArray(details.skills) ? details.skills.map(String).slice(0, 2) : [];
      return {
        id: owner._id ? String(owner._id) : String(item._id),
        listingId: String(item._id),
        name: String(owner.name || item.title),
        town: String(owner.town || location.name || ""),
        trade: String(details.profession || details.headline || item.category),
        skills,
        photo: String(owner.avatarUrl || item.imageUrl || "") || undefined,
        rating: 0,
        reviewCount: 0,
      } satisfies HomeContractor;
    }),
    jobs: latest.map((item) => {
      const details = asRecord(item.details);
      const location = asRecord(item.location);
      return {
        id: String(item._id),
        title: item.title,
        town: String(location.name || ""),
        pay: payLabel(details),
        employmentType: String(details.employmentType || details.payType || "contract"),
      } satisfies HomeJob;
    }),
  };
}
