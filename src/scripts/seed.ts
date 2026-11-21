import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { listingStatus, requestStatus } from "../lib/status";
import { listingDetailsSchema, requestWriteSchema } from "../lib/validators";
import { Listing } from "../models/Listing";
import { Location } from "../models/Location";
import { Request } from "../models/Request";
import { User } from "../models/User";

const DEMO_PASSWORD = "demo123";
const JOB_APPLICATION_MESSAGE =
  "I finished a TVET construction diploma and have worked on two house sites in Agaro. I can start this month.";
const RENTAL_BOOKING_MESSAGE =
  "I need the mixer for a small residential slab in Jimma from 1 to 5 December 2026. I can collect it.";

const locationSeeds = [
  { name: "Jimma", region: "Oromia", zone: "Jimma" },
  { name: "Agaro", region: "Oromia", zone: "Jimma" },
  { name: "Bedele", region: "Oromia", zone: "Buno Bedele" },
  { name: "Mettu", region: "Oromia", zone: "Ilu Aba Bor" },
  { name: "Bonga", region: "Southwest Ethiopia", zone: "Kafa" },
];

const userSeeds = [
  { email: "admin@buildlink.et", name: "Abel Mekonnen", town: "Jimma", isAdmin: true },
  { email: "sara@buildlink.et", name: "Sara Bekele", town: "Jimma", isAdmin: false },
  { email: "dawit@buildlink.et", name: "Dawit Tadesse", town: "Agaro", isAdmin: false },
  { email: "hana@buildlink.et", name: "Hana Girma", town: "Jimma", isAdmin: false },
  { email: "yonas@buildlink.et", name: "Yonas Alemu", town: "Bedele", isAdmin: false },
  { email: "meron@buildlink.et", name: "Meron Abebe", town: "Mettu", isAdmin: false },
];

type ListingSeed = {
  seedKey: string;
  type: "job" | "material" | "rental" | "professional";
  ownerEmail: string;
  title: string;
  description: string;
  category: string;
  town: string;
  verification?: "none" | "pending" | "verified" | "rejected";
  details: Record<string, unknown>;
};

const listingSeeds: ListingSeed[] = [
  {
    seedKey: "job-site-engineer",
    type: "job",
    ownerEmail: "sara@buildlink.et",
    title: "Junior site engineer",
    description:
      "A Jimma contractor needs a junior site engineer for a residential block. The role covers daily site checks, concrete pours, and reporting to the supervisor.",
    category: "Civil engineering",
    town: "Jimma",
    details: {
      experienceLevel: "junior",
      employmentType: "permanent",
      salaryNegotiable: false,
      salaryAmount: 18000,
      currency: "ETB",
      applicationDeadline: "2026-12-31",
      skills: ["site supervision", "concrete works"],
    },
  },
  {
    seedKey: "job-mason",
    type: "job",
    ownerEmail: "sara@buildlink.et",
    title: "Mason for a two-storey house",
    description:
      "A house build in Agaro needs a mason for blockwork and plaster. The job is contract work and can start this month.",
    category: "Masonry",
    town: "Agaro",
    details: {
      experienceLevel: "intermediate",
      employmentType: "contract",
      salaryNegotiable: true,
      currency: "ETB",
      skills: ["blockwork", "plaster"],
    },
  },
  {
    seedKey: "job-electrician",
    type: "job",
    ownerEmail: "sara@buildlink.et",
    title: "Contract electrician",
    description:
      "Wiring and fittings for a small commercial shop in Jimma. Experience with house and shop circuits is enough.",
    category: "Electrical installation",
    town: "Jimma",
    details: {
      experienceLevel: "junior",
      employmentType: "contract",
      salaryNegotiable: true,
      currency: "ETB",
      skills: ["wiring", "fittings"],
    },
  },
  {
    seedKey: "material-tiles",
    type: "material",
    ownerEmail: "meron@buildlink.et",
    title: "Surplus ceramic floor tiles",
    description:
      "Leftover floor tiles from a finished house in Mettu. They are unused surplus, stored under cover, and ready for pickup.",
    category: "Tiles and ceramics",
    town: "Mettu",
    details: {
      condition: "Unused surplus",
      quantity: 80,
      unit: "m2",
      price: 450,
      currency: "ETB",
      negotiable: true,
      deliveryOption: "pickup",
    },
  },
  {
    seedKey: "material-cement",
    type: "material",
    ownerEmail: "sara@buildlink.et",
    title: "Unused OPC cement bags",
    description:
      "Forty bags of ordinary Portland cement bought for a job that changed. The bags are unopened and stored indoors in Jimma.",
    category: "Cement and dry construction mixtures",
    town: "Jimma",
    details: {
      condition: "New and unused",
      quantity: 40,
      unit: "bag",
      price: 1200,
      currency: "ETB",
      negotiable: false,
      deliveryOption: "pickup",
    },
  },
  {
    seedKey: "material-doors",
    type: "material",
    ownerEmail: "yonas@buildlink.et",
    title: "Reclaimed timber doors",
    description:
      "Six timber doors taken off a renovation in Bedele. They are reusable, need new hinges, and can be collected from the yard.",
    category: "Doors and windows",
    town: "Bedele",
    details: {
      condition: "Reusable / reclaimed",
      quantity: 6,
      unit: "piece",
      price: 1800,
      currency: "ETB",
      negotiable: true,
      deliveryOption: "pickup",
    },
  },
  {
    seedKey: "rental-mixer",
    type: "rental",
    ownerEmail: "yonas@buildlink.et",
    title: "Concrete mixer, 350 litres",
    description:
      "A 350 litre mixer available for daily hire. The machine is in good working order. Fuel and an operator are not included.",
    category: "Concrete mixers",
    town: "Jimma",
    details: {
      price: 2500,
      currency: "ETB",
      pricePeriod: "daily",
      condition: "Good",
      operatorIncluded: false,
    },
  },
  {
    seedKey: "rental-generator",
    type: "rental",
    ownerEmail: "yonas@buildlink.et",
    title: "Generator, 5 kVA",
    description:
      "A 5 kVA generator for site power in Bedele. It can be hired by the day. The owner can explain fuel use before you book.",
    category: "Generators",
    town: "Bedele",
    details: {
      price: 1800,
      currency: "ETB",
      pricePeriod: "daily",
      condition: "Good",
      operatorIncluded: false,
    },
  },
  {
    seedKey: "rental-scaffold",
    type: "rental",
    ownerEmail: "yonas@buildlink.et",
    title: "Scaffolding set",
    description:
      "A small scaffolding set for house work around Agaro. Frames and boards are included. The renter arranges transport.",
    category: "Scaffolding",
    town: "Agaro",
    details: {
      price: 800,
      currency: "ETB",
      pricePeriod: "daily",
      condition: "Fair",
      operatorIncluded: false,
    },
  },
  {
    seedKey: "professional-hana",
    type: "professional",
    ownerEmail: "hana@buildlink.et",
    title: "Hana Girma",
    description:
      "Civil engineer based in Jimma. Hana supervises residential builds and checks quantities before concrete is poured.",
    category: "Civil engineering",
    town: "Jimma",
    verification: "pending",
    details: {
      headline: "Civil engineer for residential sites",
      profession: "Civil engineer",
      skills: ["site supervision", "quantity checks"],
      availability: "Available",
    },
  },
  {
    seedKey: "professional-dawit",
    type: "professional",
    ownerEmail: "dawit@buildlink.et",
    title: "Dawit Tadesse",
    description:
      "Mason and plasterer in Agaro. Dawit takes blockwork, plaster, and small repair jobs for houses and shops.",
    category: "Masonry",
    town: "Agaro",
    details: {
      headline: "Mason and plasterer",
      profession: "Mason",
      skills: ["blockwork", "plaster"],
      availability: "Available",
    },
  },
  {
    seedKey: "professional-sara",
    type: "professional",
    ownerEmail: "sara@buildlink.et",
    title: "Sara Bekele",
    description:
      "Site supervisor who runs small residential jobs in Jimma and nearby towns. Sara coordinates crews, materials, and daily progress.",
    category: "Site supervision",
    town: "Jimma",
    details: {
      headline: "Site supervisor for house builds",
      profession: "Site supervisor",
      skills: ["crew coordination", "progress reports"],
      availability: "Limited",
    },
  },
];

async function upsertLocation(seed: (typeof locationSeeds)[number]) {
  const existing = await Location.findOne({ name: seed.name });
  const location = existing ?? new Location({ name: seed.name });
  location.set({ ...seed, active: true });
  await location.save();
  return location;
}

async function upsertUser(
  seed: (typeof userSeeds)[number],
  passwordHash: string,
) {
  const existing = await User.findOne({ email: seed.email });
  const user = existing ?? new User({ email: seed.email });
  user.set({
    name: seed.name,
    town: seed.town,
    isAdmin: seed.isAdmin,
    accountStatus: "active",
    passwordHash,
  });
  await user.save();
  return user;
}

function validateSeedShapes() {
  const counts = { job: 0, material: 0, rental: 0, professional: 0 };
  for (const seed of listingSeeds) {
    listingDetailsSchema.parse({ type: seed.type, details: seed.details });
    counts[seed.type] += 1;
  }
  if (Object.values(counts).some((count) => count !== 3)) {
    throw new Error("Each module needs three demo listings");
  }
  const pending = listingSeeds.filter(
    (seed) => seed.type === "professional" && seed.verification === "pending",
  );
  if (pending.length !== 1) {
    throw new Error("Seed needs one professional with verification pending");
  }
  const listingId = "64b000000000000000000001";
  requestWriteSchema.parse({
    type: "job",
    listingId,
    message: JOB_APPLICATION_MESSAGE,
  });
  requestWriteSchema.parse({
    type: "rental",
    listingId,
    message: RENTAL_BOOKING_MESSAGE,
    startDate: "2026-12-01",
    endDate: "2026-12-05",
  });
}

async function main() {
  validateSeedShapes();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const locations = new Map<string, mongoose.Types.ObjectId>();
  for (const seed of locationSeeds) {
    const location = await upsertLocation(seed);
    locations.set(seed.name, location._id);
  }

  const users = new Map<string, mongoose.Types.ObjectId>();
  for (const seed of userSeeds) {
    const user = await upsertUser(seed, passwordHash);
    users.set(seed.email, user._id);
  }

  const listings = new Map<string, mongoose.Types.ObjectId>();
  for (const seed of listingSeeds) {
    const parsed = listingDetailsSchema.parse({ type: seed.type, details: seed.details });
    const owner = users.get(seed.ownerEmail);
    const location = locations.get(seed.town);
    if (!owner || !location) throw new Error(`Missing owner or town for ${seed.seedKey}`);

    const existing = await Listing.findOne({ seedKey: seed.seedKey });
    const listing = existing ?? new Listing({ seedKey: seed.seedKey });
    listing.set({
      type: parsed.type,
      owner,
      title: seed.title,
      description: seed.description,
      category: seed.category,
      location,
      status: listingStatus[parsed.type].initial,
      details: parsed.details,
      verification: seed.verification ?? "none",
    });
    await listing.save();
    listings.set(seed.seedKey, listing._id);
  }

  const job = listings.get("job-site-engineer");
  const mixer = listings.get("rental-mixer");
  const dawit = users.get("dawit@buildlink.et");
  const sara = users.get("sara@buildlink.et");
  const meron = users.get("meron@buildlink.et");
  const yonas = users.get("yonas@buildlink.et");
  if (!job || !mixer || !dawit || !sara || !meron || !yonas) {
    throw new Error("Seed is missing a listing or user needed for demo requests");
  }

  const application = requestWriteSchema.parse({
    type: "job",
    listingId: job.toString(),
    message: JOB_APPLICATION_MESSAGE,
  });
  const booking = requestWriteSchema.parse({
    type: "rental",
    listingId: mixer.toString(),
    message: RENTAL_BOOKING_MESSAGE,
    startDate: "2026-12-01",
    endDate: "2026-12-05",
  });

  await upsertRequest("request-job-site-engineer", {
    type: application.type,
    listing: job,
    from: dawit,
    to: sara,
    message: application.message,
    status: requestStatus.job.initial,
  });
  await upsertRequest("request-rental-mixer", {
    type: booking.type,
    listing: mixer,
    from: meron,
    to: yonas,
    message: booking.message,
    startDate: new Date("2026-12-01T00:00:00.000Z"),
    endDate: new Date("2026-12-05T00:00:00.000Z"),
    status: "Approved",
  });

  console.log("Seed complete. Re-running updates the same demo records.");
  console.log(`Password for every demo account: ${DEMO_PASSWORD}`);
  for (const user of userSeeds) {
    console.log(`${user.email}${user.isAdmin ? " (admin)" : ""}`);
  }
  console.log(`Locations: ${locations.size}`);
  console.log(`Listings: ${listings.size}`);
  console.log("Requests: job application Submitted, rental booking Approved 2026-12-01 to 2026-12-05");
  console.log("Professional verification pending: hana@buildlink.et");
}

async function upsertRequest(seedKey: string, data: Record<string, unknown>) {
  const existing = await Request.findOne({ seedKey });
  const request = existing ?? new Request({ seedKey });
  request.set(data);
  await request.save();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
