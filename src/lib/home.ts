import { connectDB } from "@/lib/db";
import { payLabel } from "@/lib/pay";
import { ratingFor } from "@/lib/profile";
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

export async function loadHomeContent() {
  await connectDB();
  const [jobs, contractors, materials, equipment, people, latest] = await Promise.all([
    Listing.countDocuments({ type: "job", status: "Open" }),
    Listing.countDocuments({ type: "professional", status: "Active" }),
    Listing.countDocuments({ type: "material", status: { $in: ["Available", "Reserved"] } }),
    Listing.countDocuments({ type: "rental", status: "Available" }),
    Listing.find({ type: "professional", status: "Active" })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("owner", "name town avatarUrl skills")
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
    contractors: (
      await Promise.all(
        people.map(async (item) => {
          const details = asRecord(item.details);
          const owner = asRecord(item.owner);
          const location = asRecord(item.location);
          const ownerSkills = Array.isArray(owner.skills) ? owner.skills.map(String) : [];
          const listingSkills = Array.isArray(details.skills) ? details.skills.map(String) : [];
          const skills = (ownerSkills.length > 0 ? ownerSkills : listingSkills).slice(0, 2);
          const stats = owner._id ? await ratingFor(String(owner._id)) : { average: 0, count: 0 };
          return {
            id: owner._id ? String(owner._id) : String(item._id),
            listingId: String(item._id),
            name: String(owner.name || item.title),
            town: String(owner.town || location.name || ""),
            trade: String(details.profession || details.headline || item.category),
            skills,
            photo: String(owner.avatarUrl || item.imageUrl || "") || undefined,
            rating: stats.average,
            reviewCount: stats.count,
          } satisfies HomeContractor;
        }),
      )
    )
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, 3),
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
