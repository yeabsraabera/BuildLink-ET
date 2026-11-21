import { toPublicOwner } from "@/lib/auth";

type Ref = {
  _id?: unknown;
  name?: string;
  town?: string;
  region?: string;
  zone?: string;
  title?: string;
  type?: string;
  status?: string;
};

function asRef(value: unknown): Ref | null {
  if (!value || typeof value !== "object") return null;
  return value as Ref;
}

export function refId(value: unknown) {
  const ref = asRef(value);
  if (ref?._id) return String(ref._id);
  return value ? String(value) : "";
}

export function dateOnly(value: unknown) {
  if (!value) return undefined;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function publicListing(
  listing: {
    _id: unknown;
    type: string;
    title: string;
    description: string;
    category: string;
    status: string;
    imageUrl?: string;
    details?: unknown;
    verification?: string;
    createdAt?: Date;
    owner?: unknown;
    location?: unknown;
  },
  viewerId?: string | null,
) {
  const owner = asRef(listing.owner);
  const location = asRef(listing.location);
  return {
    id: String(listing._id),
    type: listing.type,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    status: listing.status,
    imageUrl: listing.imageUrl || undefined,
    details: (listing.details ?? {}) as Record<string, unknown>,
    verification: listing.verification ?? "none",
    createdAt: listing.createdAt ? new Date(listing.createdAt).toISOString() : undefined,
    isOwner: Boolean(viewerId && refId(listing.owner) === viewerId),
    location: {
      id: refId(listing.location),
      name: location?.name ?? "",
      region: location?.region ?? "",
      zone: location?.zone ?? "",
    },
    owner: toPublicOwner({
      _id: owner?._id ?? listing.owner,
      name: owner?.name ?? "Unknown",
      town: owner?.town ?? "",
    }),
  };
}

export function publicRequest(
  request: {
    _id: unknown;
    type: string;
    message: string;
    status: string;
    startDate?: unknown;
    endDate?: unknown;
    quantity?: number;
    proposedFee?: number;
    createdAt?: Date;
    listing?: unknown;
    from?: unknown;
    to?: unknown;
  },
  viewerId?: string | null,
) {
  const listing = asRef(request.listing);
  const from = asRef(request.from);
  const to = asRef(request.to);
  const fromId = refId(request.from);
  const toId = refId(request.to);
  return {
    id: String(request._id),
    type: request.type,
    message: request.message,
    status: request.status,
    startDate: dateOnly(request.startDate),
    endDate: dateOnly(request.endDate),
    quantity: request.quantity,
    proposedFee: request.proposedFee,
    createdAt: request.createdAt ? new Date(request.createdAt).toISOString() : undefined,
    listing: {
      id: refId(request.listing),
      title: listing?.title ?? "",
      type: listing?.type ?? request.type,
      status: listing?.status ?? "",
    },
    from: toPublicOwner({ _id: from?._id ?? request.from, name: from?.name ?? "Unknown", town: from?.town ?? "" }),
    to: toPublicOwner({ _id: to?._id ?? request.to, name: to?.name ?? "Unknown", town: to?.town ?? "" }),
    viewer: viewerId && fromId === viewerId ? "from" : viewerId && toId === viewerId ? "to" : "other",
  };
}
