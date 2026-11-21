import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { listingStatus, requestStatus } from "../lib/status";
import { listingDetailsSchema, requestWriteSchema } from "../lib/validators";
import { Listing } from "../models/Listing";
import { Location } from "../models/Location";
import { Request } from "../models/Request";
import { Review } from "../models/Review";
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

type ExperienceSeed = { title: string; company: string; years: string; description: string };

type UserSeed = {
  email: string;
  name: string;
  town: string;
  isAdmin: boolean;
  profileRole: "contractor" | "employer" | "both";
  headline: string;
  bio: string;
  skills: string[];
  experience: ExperienceSeed[];
  avatarUrl: string;
};

const userSeeds: UserSeed[] = [
  {
    email: "admin@buildlink.et",
    name: "Abel Mekonnen",
    town: "Jimma",
    isAdmin: true,
    profileRole: "both",
    headline: "BuildLink ET administrator",
    bio: "Reviews listings for the Jimma pilot and keeps the marketplace usable.",
    skills: ["Moderation"],
    experience: [
      {
        title: "Platform admin",
        company: "BuildLink ET",
        years: "2026",
        description: "Reviews listings and reports for the Jimma pilot.",
      },
    ],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
  },
  {
    email: "sara@buildlink.et",
    name: "Sara Tadesse",
    town: "Jimma",
    isAdmin: false,
    profileRole: "employer",
    headline: "House builder in Jimma",
    bio: "Building a family house near Aba Jifar and hiring local crews for masonry, finishing, and site coordination.",
    skills: ["Site supervision", "Budgeting"],
    experience: [
      {
        title: "Owner-builder",
        company: "Private house, Jimma",
        years: "2024-present",
        description: "Running a two-storey house build from foundation to finishes.",
      },
    ],
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
  },
  {
    email: "meron@buildlink.et",
    name: "Meron Haile",
    town: "Mettu",
    isAdmin: false,
    profileRole: "employer",
    headline: "Renovation lead, Mettu",
    bio: "Renovating a shop and small rooms in Mettu. Needs masons and finishing trades, and lists leftover materials.",
    skills: ["Renovation", "Procurement"],
    experience: [
      {
        title: "Shop renovation",
        company: "Haile Trading, Mettu",
        years: "2025-present",
        description: "Replacing floors, walls, and wiring in a street-front shop.",
      },
    ],
    avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=256&q=80",
  },
  {
    email: "abebe@buildlink.et",
    name: "Abebe Bekele",
    town: "Bonga",
    isAdmin: false,
    profileRole: "employer",
    headline: "Clinic extension, Bonga",
    bio: "Hiring electricians and labour for a small clinic extension in Bonga, with a clear start date and a fixed budget.",
    skills: ["Project coordination"],
    experience: [
      {
        title: "Clinic extension owner",
        company: "Bonga health post",
        years: "2026",
        description: "Adding two rooms and a waiting area to an existing clinic.",
      },
    ],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
  },
  {
    email: "dawit@buildlink.et",
    name: "Dawit Kebede",
    town: "Agaro",
    isAdmin: false,
    profileRole: "contractor",
    headline: "Mason for houses and small shops",
    bio: "Blockwork, plaster, and finishing around Agaro and Jimma. I bring my own trowels and can join a crew or lead a small team.",
    skills: ["Masonry", "Blockwork", "Plaster"],
    experience: [
      {
        title: "Lead mason",
        company: "Private houses, Agaro",
        years: "2019-present",
        description: "Laid block walls and plastered interiors for family houses.",
      },
      {
        title: "Mason",
        company: "Shop builds, Jimma",
        years: "2016-2019",
        description: "Worked on street-front shops: foundations, walls, and pointing.",
      },
      {
        title: "Helper then mason",
        company: "Local crews, Agaro",
        years: "2014-2016",
        description: "Started as a helper mixing mortar, then took on wall courses.",
      },
    ],
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
  },
  {
    email: "hana@buildlink.et",
    name: "Hana Alemu",
    town: "Jimma",
    isAdmin: false,
    profileRole: "contractor",
    headline: "Electrician for houses and small sites",
    bio: "House wiring, sockets, and lighting in Jimma. I read drawings, work to code, and can estimate materials before starting.",
    skills: ["House wiring", "Lighting", "Distribution boards"],
    experience: [
      {
        title: "House electrician",
        company: "Independent, Jimma",
        years: "2021-present",
        description: "Wired new houses and rewired older rooms for families in Jimma.",
      },
      {
        title: "Electrician assistant",
        company: "Site crews, Jimma",
        years: "2018-2021",
        description: "Pulled cables and fitted sockets on housing sites.",
      },
    ],
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80",
  },
  {
    email: "yonas@buildlink.et",
    name: "Yonas Girma",
    town: "Bedele",
    isAdmin: false,
    profileRole: "contractor",
    headline: "Site engineer for small builds",
    bio: "Sets out foundations, checks levels, and keeps a small site moving in Bedele and Jimma. Also lists mixers and tools for hire.",
    skills: ["Setting out", "Site supervision", "Quantity checks"],
    experience: [
      {
        title: "Site engineer",
        company: "House projects, Bedele",
        years: "2022-present",
        description: "Ran day-to-day setting out and quality checks on family houses.",
      },
      {
        title: "Junior site engineer",
        company: "Contractor crews, Jimma",
        years: "2019-2022",
        description: "Supported the engineer with measurements and material counts.",
      },
      {
        title: "Survey helper",
        company: "Local projects, Bedele",
        years: "2017-2019",
        description: "Held tapes and recorded levels on small public works.",
      },
    ],
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
  },
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
    title: "Junior site engineer, Jimma house build",
    description:
      "A two-storey house in Jimma needs a junior site engineer to check levels, keep a simple daily log, and coordinate masons for six weeks. You will walk the site each morning and report to the owner.",
    category: "Civil engineering",
    town: "Jimma",
    details: {
      experienceLevel: "junior",
      employmentType: "contract",
      workersNeeded: 1,
      duration: "6 weeks",
      startDate: "2026-12-08",
      payType: "per month",
      payAmount: 18000,
      salaryNegotiable: false,
      salaryAmount: 18000,
      currency: "ETB",
      applicationDeadline: "2026-12-15",
      skills: ["setting out", "site diary"],
    },
  },
  {
    seedKey: "job-mason",
    type: "job",
    ownerEmail: "meron@buildlink.et",
    title: "Mason for blockwork, Mettu shop",
    description:
      "We need two masons for block walls and plaster on a shop renovation in Mettu. Daily paid work for about three weeks. Bring your own trowel and level.",
    category: "Masonry",
    town: "Mettu",
    details: {
      experienceLevel: "intermediate",
      employmentType: "daily",
      workersNeeded: 2,
      duration: "3 weeks",
      startDate: "2026-12-01",
      payType: "per day",
      payAmount: 800,
      salaryNegotiable: false,
      salaryAmount: 800,
      currency: "ETB",
      applicationDeadline: "2026-11-30",
      skills: ["blockwork", "plaster"],
    },
  },
  {
    seedKey: "job-electrician",
    type: "job",
    ownerEmail: "abebe@buildlink.et",
    title: "House electrician, Bonga clinic",
    description:
      "Wiring, sockets, and lighting for a two-room clinic extension in Bonga. Fixed fee for the full job. Bring your own hand tools. Materials are supplied.",
    category: "Electrical installation",
    town: "Bonga",
    details: {
      experienceLevel: "junior",
      employmentType: "contract",
      workersNeeded: 1,
      duration: "10 days",
      startDate: "2026-12-10",
      payType: "fixed fee",
      payAmount: 22000,
      salaryNegotiable: false,
      salaryAmount: 22000,
      currency: "ETB",
      applicationDeadline: "2026-12-01",
      skills: ["house wiring", "lighting"],
    },
  },
  {
    seedKey: "job-plaster",
    type: "job",
    ownerEmail: "sara@buildlink.et",
    title: "Plaster crew, Jimma finishes",
    description:
      "Internal plaster and pointing on a two-storey house in Jimma. The owner needs three workers for two weeks. Pay is negotiable within a stated range.",
    category: "Masonry",
    town: "Jimma",
    details: {
      experienceLevel: "junior",
      employmentType: "daily",
      workersNeeded: 3,
      duration: "2 weeks",
      startDate: "2026-12-20",
      payType: "negotiable",
      payMin: 600,
      payMax: 900,
      salaryNegotiable: true,
      currency: "ETB",
      applicationDeadline: "2026-12-10",
      skills: ["plaster", "pointing"],
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
    title: "Hana Alemu, electrician",
    description:
      "Electrician based in Jimma. Hana wires houses and small sites, fits sockets and lighting, and can estimate materials before starting.",
    category: "Electrical installation",
    town: "Jimma",
    verification: "pending",
    details: {
      headline: "Electrician for houses and small sites",
      profession: "Electrician",
      skills: ["house wiring", "lighting"],
      availability: "Available",
    },
  },
  {
    seedKey: "professional-dawit",
    type: "professional",
    ownerEmail: "dawit@buildlink.et",
    title: "Dawit Kebede, mason",
    description:
      "Mason and plasterer in Agaro. Dawit takes blockwork, plaster, and small repair jobs for houses and shops.",
    category: "Masonry",
    town: "Agaro",
    details: {
      headline: "Mason for houses and small shops",
      profession: "Mason",
      skills: ["blockwork", "plaster"],
      availability: "Available",
    },
  },
  {
    seedKey: "professional-sara",
    type: "professional",
    ownerEmail: "yonas@buildlink.et",
    title: "Yonas Girma, site engineer",
    description:
      "Site engineer who sets out foundations, checks levels, and keeps a small house site moving in Bedele and Jimma. Yonas also lists mixers and tools.",
    category: "Civil engineering",
    town: "Bedele",
    details: {
      headline: "Site engineer for small builds",
      profession: "Site engineer",
      skills: ["setting out", "site supervision"],
      availability: "Limited",
    },
  },
];

type AcceptedSeed = {
  seedKey: string;
  listingKey: string;
  fromEmail: string;
  toEmail: string;
  message: string;
};

const acceptedJobSeeds: AcceptedSeed[] = [
  {
    seedKey: "request-accepted-dawit-mason",
    listingKey: "job-mason",
    fromEmail: "dawit@buildlink.et",
    toEmail: "meron@buildlink.et",
    message: "I can lead the blockwork in Mettu and bring a helper for mixing.",
  },
  {
    seedKey: "request-accepted-hana-mason",
    listingKey: "job-mason",
    fromEmail: "hana@buildlink.et",
    toEmail: "meron@buildlink.et",
    message: "I can fit temporary site power while the walls go up.",
  },
  {
    seedKey: "request-accepted-yonas-mason",
    listingKey: "job-mason",
    fromEmail: "yonas@buildlink.et",
    toEmail: "meron@buildlink.et",
    message: "I can set out the shop floor and check the wall lines.",
  },
  {
    seedKey: "request-accepted-dawit-electrician",
    listingKey: "job-electrician",
    fromEmail: "dawit@buildlink.et",
    toEmail: "abebe@buildlink.et",
    message: "I can chase walls and close up after the wiring.",
  },
  {
    seedKey: "request-accepted-hana-electrician",
    listingKey: "job-electrician",
    fromEmail: "hana@buildlink.et",
    toEmail: "abebe@buildlink.et",
    message: "I can wire the two clinic rooms and label the board.",
  },
  {
    seedKey: "request-accepted-yonas-electrician",
    listingKey: "job-electrician",
    fromEmail: "yonas@buildlink.et",
    toEmail: "abebe@buildlink.et",
    message: "I can check levels before you chase walls for cables.",
  },
  {
    seedKey: "request-accepted-dawit-plaster",
    listingKey: "job-plaster",
    fromEmail: "dawit@buildlink.et",
    toEmail: "sara@buildlink.et",
    message: "I can lead the plaster crew and keep the finish even.",
  },
  {
    seedKey: "request-accepted-hana-plaster",
    listingKey: "job-plaster",
    fromEmail: "hana@buildlink.et",
    toEmail: "sara@buildlink.et",
    message: "I can move fittings so the plaster crew can close the walls.",
  },
  {
    seedKey: "request-accepted-yonas-plaster",
    listingKey: "job-plaster",
    fromEmail: "yonas@buildlink.et",
    toEmail: "sara@buildlink.et",
    message: "I can check room levels before plaster starts.",
  },
];

type ReviewSeed = {
  seedKey: string;
  requestKey: string;
  reviewerEmail: string;
  revieweeEmail: string;
  rating: number;
  comment: string;
};

const reviewSeeds: ReviewSeed[] = [
  {
    seedKey: "review-meron-dawit",
    requestKey: "request-accepted-dawit-mason",
    reviewerEmail: "meron@buildlink.et",
    revieweeEmail: "dawit@buildlink.et",
    rating: 5,
    comment: "Dawit laid the shop walls cleanly and finished on time. The plaster is even.",
  },
  {
    seedKey: "review-abebe-dawit",
    requestKey: "request-accepted-dawit-electrician",
    reviewerEmail: "abebe@buildlink.et",
    revieweeEmail: "dawit@buildlink.et",
    rating: 4,
    comment: "Solid chase-and-close work around the clinic wiring. I would hire him again.",
  },
  {
    seedKey: "review-sara-dawit",
    requestKey: "request-accepted-dawit-plaster",
    reviewerEmail: "sara@buildlink.et",
    revieweeEmail: "dawit@buildlink.et",
    rating: 5,
    comment: "He led the plaster crew and set a good pace. Rooms are ready to paint.",
  },
  {
    seedKey: "review-abebe-hana",
    requestKey: "request-accepted-hana-electrician",
    reviewerEmail: "abebe@buildlink.et",
    revieweeEmail: "hana@buildlink.et",
    rating: 5,
    comment: "Hana wired the clinic rooms carefully and labelled the board.",
  },
  {
    seedKey: "review-meron-hana",
    requestKey: "request-accepted-hana-mason",
    reviewerEmail: "meron@buildlink.et",
    revieweeEmail: "hana@buildlink.et",
    rating: 5,
    comment: "Came to Mettu for shop lighting. Finished in two days and left the site tidy.",
  },
  {
    seedKey: "review-sara-hana",
    requestKey: "request-accepted-hana-plaster",
    reviewerEmail: "sara@buildlink.et",
    revieweeEmail: "hana@buildlink.et",
    rating: 4,
    comment: "Clear about fittings before plaster. A couple of sockets moved, then it was done.",
  },
  {
    seedKey: "review-sara-yonas",
    requestKey: "request-accepted-yonas-plaster",
    reviewerEmail: "sara@buildlink.et",
    revieweeEmail: "yonas@buildlink.et",
    rating: 5,
    comment: "Yonas caught a level error before plaster. The site diary was easy to follow.",
  },
  {
    seedKey: "review-meron-yonas",
    requestKey: "request-accepted-yonas-mason",
    reviewerEmail: "meron@buildlink.et",
    revieweeEmail: "yonas@buildlink.et",
    rating: 4,
    comment: "Helped set out the shop floor. Calm on site and clear with the masons.",
  },
  {
    seedKey: "review-abebe-yonas",
    requestKey: "request-accepted-yonas-electrician",
    reviewerEmail: "abebe@buildlink.et",
    revieweeEmail: "yonas@buildlink.et",
    rating: 5,
    comment: "Checked our clinic slab levels before we poured. Would hire again.",
  },
  {
    seedKey: "review-sara-yonas-extra",
    requestKey: "request-accepted-yonas-plaster",
    reviewerEmail: "yonas@buildlink.et",
    revieweeEmail: "sara@buildlink.et",
    rating: 5,
    comment: "Sara paid on the agreed days and had materials ready when the crew arrived.",
  },
];

async function upsertLocation(seed: (typeof locationSeeds)[number]) {
  const existing = await Location.findOne({ name: seed.name });
  const location = existing ?? new Location({ name: seed.name });
  location.set({ ...seed, active: true });
  await location.save();
  return location;
}

async function upsertUser(seed: UserSeed, passwordHash: string) {
  const existing = await User.findOne({ email: seed.email });
  const user = existing ?? new User({ email: seed.email });
  user.set({
    name: seed.name,
    town: seed.town,
    isAdmin: seed.isAdmin,
    accountStatus: "active",
    passwordHash,
    role: seed.profileRole,
    headline: seed.headline,
    bio: seed.bio,
    skills: seed.skills,
    experience: seed.experience,
    avatarUrl: seed.avatarUrl,
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
  if (counts.job < 3 || counts.material !== 3 || counts.rental !== 3 || counts.professional !== 3) {
    throw new Error("Seed needs at least three jobs and three listings in each other module");
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

  const requests = new Map<string, mongoose.Types.ObjectId>();
  for (const seed of acceptedJobSeeds) {
    const listing = listings.get(seed.listingKey);
    const from = users.get(seed.fromEmail);
    const to = users.get(seed.toEmail);
    if (!listing || !from || !to) throw new Error(`Missing ids for ${seed.seedKey}`);
    const saved = await upsertRequest(seed.seedKey, {
      type: "job",
      listing,
      from,
      to,
      message: seed.message,
      status: "Accepted",
    });
    requests.set(seed.seedKey, saved._id);
  }

  for (const seed of reviewSeeds) {
    const relatedRequest = requests.get(seed.requestKey);
    const reviewer = users.get(seed.reviewerEmail);
    const reviewee = users.get(seed.revieweeEmail);
    const listing = acceptedJobSeeds.find((item) => item.seedKey === seed.requestKey);
    const relatedListing = listing ? listings.get(listing.listingKey) : undefined;
    if (!relatedRequest || !reviewer || !reviewee || !relatedListing) {
      throw new Error(`Missing ids for ${seed.seedKey}`);
    }
    await upsertReview(seed.seedKey, {
      reviewer,
      reviewee,
      rating: seed.rating,
      comment: seed.comment,
      relatedListing,
      relatedRequest,
    });
  }

  console.log("Seed complete. Re-running updates the same records.");
  console.log(`Accounts: ${userSeeds.length}. Listings: ${listings.size}. Reviews: ${reviewSeeds.length}.`);
  console.log("Requests: one Submitted job application, nine Accepted jobs, mixer Approved 2026-12-01 to 2026-12-05.");
  console.log("Professional verification pending: hana@buildlink.et");
}

async function upsertRequest(seedKey: string, data: Record<string, unknown>) {
  const existing = await Request.findOne({ seedKey });
  const request = existing ?? new Request({ seedKey });
  request.set(data);
  await request.save();
  return request;
}

async function upsertReview(seedKey: string, data: Record<string, unknown>) {
  const existing = await Review.findOne({ seedKey });
  const review = existing ?? new Review({ seedKey });
  review.set(data);
  await review.save();
  return review;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
