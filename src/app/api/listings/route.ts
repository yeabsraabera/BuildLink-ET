import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { created, fail, isDuplicateKey, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { requireUser } from "@/lib/guards";
import { publicListing } from "@/lib/serialize";
import { isListingType, listingStatus, type ListingType } from "@/lib/status";
import { listingWriteSchema } from "@/lib/validators";
import { Listing } from "@/models/Listing";
import { Location } from "@/models/Location";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function numberParam(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

export async function GET(request: Request) {
  await connection();
  try {
    const url = new URL(request.url);
    const typeParam = url.searchParams.get("type");
    const mine = url.searchParams.get("mine") === "true";
    let type: ListingType | null = null;
    if (typeParam) {
      if (!isListingType(typeParam)) return fail("Unknown listing type", 400);
      type = typeParam;
    }

    const viewer = await getSessionUser();
    if (mine && !viewer) return fail("Sign in required", 401);
    if (viewer?.accountStatus === "suspended" && mine) {
      return fail("This account is suspended", 403);
    }

    await connectDB();
    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (mine && viewer) {
      filter.owner = viewer.id;
    } else if (type) {
      filter.status = { $nin: listingStatus[type].hiddenFromBrowse };
    } else {
      filter.$or = (["job", "material", "rental", "professional"] as const).map((item) => ({
        type: item,
        status: { $nin: listingStatus[item].hiddenFromBrowse },
      }));
    }

    const q = url.searchParams.get("q")?.trim();
    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i");
      filter.$and = [{ $or: [{ title: pattern }, { description: pattern }, { category: pattern }] }];
    }

    const category = url.searchParams.get("category")?.trim();
    if (category) filter.category = category;

    const location = url.searchParams.get("location")?.trim();
    if (location) {
      const place = /^[a-f\d]{24}$/i.test(location)
        ? await Location.findById(location).lean()
        : await Location.findOne({ name: new RegExp(`^${escapeRegex(location)}$`, "i") }).lean();
      if (!place) return ok({ items: [], page: 1, limit: 12, total: 0 }, "Listings");
      filter.location = place._id;
    }

    const page = numberParam(url.searchParams.get("page"), 1, 1000);
    const limit = numberParam(url.searchParams.get("limit"), 12, 50);
    const total = await Listing.countDocuments(filter);
    const items = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("owner", "name town")
      .populate("location", "name region zone")
      .lean();

    return ok(
      {
        items: items.map((item) => publicListing(item, viewer?.id)),
        page,
        limit,
        total,
      },
      "Listings",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const parsed = listingWriteSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    await connectDB();
    const location = await Location.findOne({ _id: parsed.data.locationId, active: true });
    if (!location) return fail("Choose an active location", 400);

    if (parsed.data.type === "professional") {
      const existing = await Listing.findOne({
        type: "professional",
        owner: auth.user.id,
        status: { $ne: "Removed" },
      }).lean();
      if (existing) return fail("You already have a professional profile", 409);
    }

    const listing = await Listing.create({
      type: parsed.data.type,
      owner: auth.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      location: location._id,
      status: listingStatus[parsed.data.type].initial,
      imageUrl: parsed.data.imageUrl || undefined,
      details: parsed.data.details,
      verification: "none",
    });

    const saved = await Listing.findById(listing._id)
      .populate("owner", "name town")
      .populate("location", "name region zone")
      .lean();
    return created(publicListing(saved!, auth.user.id), "Listing created");
  } catch (error) {
    unstable_rethrow(error);
    if (isDuplicateKey(error)) return fail("You already have a professional profile", 409);
    if (error instanceof Error && error.message.includes("not valid")) {
      return fail(error.message, 400);
    }
    return serverError(error);
  }
}
