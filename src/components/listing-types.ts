import type { ListingType } from "@/lib/status";

export type ListingCard = {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  status: string;
  imageUrl?: string;
  details: Record<string, unknown>;
  verification: string;
  createdAt?: string;
  isOwner: boolean;
  location: { id: string; name: string; region: string; zone: string };
  owner: { name: string; town: string };
  bookings?: { startDate?: string; endDate?: string }[];
};

export type RequestCard = {
  id: string;
  type: ListingType;
  message: string;
  status: string;
  startDate?: string;
  endDate?: string;
  quantity?: number;
  listing: { id: string; title: string; type: ListingType; status: string };
  from: { name: string; town: string };
  to: { name: string; town: string };
  viewer: "from" | "to" | "other";
};

export type LocationOption = { id: string; name: string; region: string; zone: string };

export function detailText(details: Record<string, unknown>, key: string) {
  const value = details[key];
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value);
}
