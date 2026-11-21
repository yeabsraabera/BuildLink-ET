export const listingTypes = ["job", "material", "rental", "professional"] as const;

export type ListingType = (typeof listingTypes)[number];

type ListingRule = {
  initial: string;
  values: readonly string[];
  hiddenFromBrowse: readonly string[];
};

type RequestRule = {
  initial: string;
  values: readonly string[];
  final: readonly string[];
  active: readonly string[];
  ownerSets: readonly string[];
  listingEffects?: Readonly<Record<string, string>>;
};

/**
 * One map for listing and request statuses. Later routes should read this
 * instead of branching on status strings.
 * Public browse hides Sold, Closed, Filled, Paused, and Removed.
 */
export const listingStatus: Record<ListingType, ListingRule> = {
  job: {
    initial: "Open",
    values: ["Open", "Closed", "Filled", "Removed"],
    hiddenFromBrowse: ["Closed", "Filled", "Removed"],
  },
  material: {
    initial: "Available",
    values: ["Available", "Reserved", "Sold", "Removed"],
    hiddenFromBrowse: ["Sold", "Removed"],
  },
  rental: {
    initial: "Available",
    values: ["Available", "Paused", "Removed"],
    hiddenFromBrowse: ["Paused", "Removed"],
  },
  professional: {
    initial: "Active",
    values: ["Active", "Paused", "Removed"],
    hiddenFromBrowse: ["Paused", "Removed"],
  },
};

export const requestStatus: Record<ListingType, RequestRule> = {
  job: {
    initial: "Submitted",
    values: [
      "Submitted",
      "Under review",
      "Shortlisted",
      "Interview requested",
      "Accepted",
      "Rejected",
      "Withdrawn",
    ],
    final: ["Accepted", "Rejected", "Withdrawn"],
    active: ["Submitted", "Under review", "Shortlisted", "Interview requested"],
    ownerSets: ["Under review", "Shortlisted", "Interview requested", "Accepted", "Rejected"],
  },
  material: {
    initial: "New",
    values: ["New", "Responded", "Negotiating", "Agreed", "Declined", "Completed", "Withdrawn"],
    final: ["Declined", "Completed", "Withdrawn"],
    active: ["New", "Responded", "Negotiating", "Agreed"],
    ownerSets: ["Responded", "Negotiating", "Agreed", "Declined", "Completed"],
    listingEffects: { Agreed: "Reserved", Completed: "Sold" },
  },
  professional: {
    initial: "New",
    values: ["New", "Responded", "Accepted", "Declined", "Withdrawn"],
    final: ["Accepted", "Declined", "Withdrawn"],
    active: ["New", "Responded"],
    ownerSets: ["Responded", "Accepted", "Declined"],
  },
  rental: {
    initial: "Requested",
    values: ["Requested", "Approved", "Rejected", "Returned", "Withdrawn"],
    final: ["Rejected", "Returned", "Withdrawn"],
    active: ["Requested", "Approved"],
    ownerSets: ["Approved", "Rejected", "Returned"],
  },
};

export const requesterWithdrawStatus = "Withdrawn";

export const professionalVerification = {
  initial: "none",
  values: ["none", "pending", "verified", "rejected"],
  ownerMaySet: ["pending"],
  adminSets: ["verified", "rejected"],
} as const;

export function isListingType(value: string): value is ListingType {
  return (listingTypes as readonly string[]).includes(value);
}

export function listingStatusValues(type: ListingType) {
  return listingStatus[type].values;
}

export function isAllowedListingStatus(type: ListingType, status: string) {
  return (listingStatus[type].values as readonly string[]).includes(status);
}

export function isPublicListingStatus(type: ListingType, status: string) {
  return (
    isAllowedListingStatus(type, status) &&
    !(listingStatus[type].hiddenFromBrowse as readonly string[]).includes(status)
  );
}

export function isAllowedRequestStatus(type: ListingType, status: string) {
  return (requestStatus[type].values as readonly string[]).includes(status);
}

export function isFinalRequestStatus(type: ListingType, status: string) {
  return (requestStatus[type].final as readonly string[]).includes(status);
}

export function assertListingStatus(type: string, status: string) {
  if (!isListingType(type) || !isAllowedListingStatus(type, status)) {
    throw new Error(`Status "${status}" is not valid for a ${type} listing`);
  }
}

export function assertRequestStatus(type: string, status: string) {
  if (!isListingType(type) || !isAllowedRequestStatus(type, status)) {
    throw new Error(`Status "${status}" is not valid for a ${type} request`);
  }
}

export function requestActorMaySet(
  type: ListingType,
  current: string,
  next: string,
  actor: "from" | "to",
) {
  if (!isAllowedRequestStatus(type, next) || isFinalRequestStatus(type, current)) return false;
  if (next === requesterWithdrawStatus) return actor === "from";
  if (actor !== "to") return false;
  return (requestStatus[type].ownerSets as readonly string[]).includes(next);
}

export function listingStatusAfterRequest(type: ListingType, next: string) {
  return requestStatus[type].listingEffects?.[next] ?? null;
}
