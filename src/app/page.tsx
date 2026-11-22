import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { HeroSearch } from "@/components/hero-search";
import { HomeFeedSkeleton } from "@/components/skeleton";
import { Stars } from "@/components/stars";
import { getSessionUser } from "@/lib/auth";
import { loadHomeContent } from "@/lib/home";
import { listTowns, type TownOption } from "@/lib/locations";
import { loginHref } from "@/lib/paths";

const HERO =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80";
const CARD_HIRE =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80";
const CARD_JOBS =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80";
const CARD_RENT =
  "https://images.unsplash.com/photo-1517089152318-42ec560349c0?auto=format&fit=crop&w=900&q=80";
const ABOUT_PHOTO =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80";

const introCards = [
  {
    href: "/professionals",
    image: CARD_HIRE,
    title: "Hire skilled contractors",
    text: "Find masons, electricians, and site engineers who already work in Jimma and nearby towns.",
  },
  {
    href: "/jobs",
    image: CARD_JOBS,
    title: "Find construction jobs",
    text: "See what the site needs, what it pays, and apply with a short cover message.",
  },
  {
    href: "/rentals",
    image: CARD_RENT,
    title: "Rent equipment and reuse materials",
    text: "Borrow mixers and tools, or pick up surplus from a finished job.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="bg-page">
      <section className="relative min-h-[34rem] overflow-hidden bg-navy text-white">
        <Image src={HERO} alt="" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-navy/90" />
        <div className="relative mx-auto flex min-h-[34rem] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl" style={{ fontWeight: 700 }}>
            Build Smarter. Connect Better. Waste Less.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
            Jobs, contractors, surplus materials and equipment rentals across Southwest Ethiopia
          </p>
          <Suspense fallback={<div className="mt-8 h-28 w-full max-w-3xl" />}>
            <HeroTools />
          </Suspense>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-14 grid max-w-6xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {introCards.map((card) => (
          <article key={card.title} className="overflow-hidden rounded-xl border border-line bg-card fade-in">
            <div className="relative h-40 bg-navy">
              <Image src={card.image} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
            <div className="p-4">
              <h2 className="text-lg">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{card.text}</p>
              <Link href={card.href} className="mt-3 inline-block rounded-xl bg-accent px-3 py-1.5 text-sm text-accent-ink">
                Read more
              </Link>
            </div>
          </article>
        ))}
      </div>

      <Suspense fallback={<HomeFeedSkeleton />}>
        <LiveHome />
      </Suspense>
    </div>
  );
}

async function HeroTools() {
  await connection();
  const [signedIn, towns] = await Promise.all([
    getSessionUser().then((user) => Boolean(user)),
    listTowns().catch(() => [] as TownOption[]),
  ]);
  return (
    <>
      <HeroSearch towns={towns} />
      {signedIn ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm text-accent-ink hover:bg-accent-hover">
            Go to dashboard
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm text-accent-ink hover:bg-accent-hover">
            Create account
          </Link>
          <Link href="/login" className="inline-flex rounded-xl border border-white px-5 py-2.5 text-sm text-white hover:bg-white/10">
            Log in
          </Link>
        </div>
      )}
    </>
  );
}

async function LiveHome() {
  await connection();
  const [{ stats, contractors, jobs }, signedIn] = await Promise.all([
    loadHomeContent(),
    getSessionUser().then((user) => Boolean(user)),
  ]);

  return (
    <>
      <section className="mx-auto mt-12 max-w-6xl px-4">
        <SectionIntro
          kicker="Right now"
          title="What is open today"
          text="A live count from the Jimma pilot. New visitors can see the work, the people, and the materials before they create an account."
        />
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Open jobs" value={stats.jobs} tone="bg-stat-job text-stat-job-ink" />
          <Stat label="Contractors" value={stats.contractors} tone="bg-stat-crew text-stat-crew-ink" />
          <Stat label="Materials" value={stats.materials} tone="bg-stat-material text-stat-material-ink" />
          <Stat label="Equipment" value={stats.equipment} tone="bg-stat-gear text-stat-gear-ink" />
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <SectionIntro kicker="People" title="Featured contractors" text="Masons, electricians, and site engineers with a trade, a town, and reviews from finished work." />
        {contractors.length === 0 ? (
          <EmptyState
            title="No contractors yet"
            text="Public contractor profiles will show up here once someone publishes one."
            action={
              <Link href={loginHref("/professionals/new", signedIn)} className="inline-flex rounded-xl bg-accent px-3 py-1.5 text-sm text-accent-ink">
                {signedIn ? "Publish your profile" : "Log in to publish"}
              </Link>
            }
          />
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contractors.map((person) => (
              <li key={person.listingId} className="rounded-xl border border-line bg-card p-4">
                <div className="flex items-center gap-3">
                  {person.photo ? (
                    <Image src={person.photo} alt="" width={56} height={56} className="h-14 w-14 rounded-xl bg-navy object-cover ring-2 ring-line" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy text-white">
                      {person.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate">{person.name}</p>
                    <p className="text-sm text-muted">
                      {person.trade} · {person.town}
                    </p>
                  </div>
                </div>
                <Stars value={person.rating} count={person.reviewCount} />
                {person.skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {person.skills.map((skill) => (
                      <span key={skill} className="rounded-md border border-line bg-page px-2 py-1 text-xs text-muted">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
                <Link
                  href={loginHref(`/profile/${person.id}`, signedIn)}
                  className="mt-4 inline-flex rounded-xl bg-accent px-3 py-1.5 text-sm text-accent-ink"
                >
                  View profile
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <SectionIntro
          kicker="Work"
          title="Latest jobs"
          text="New roles from employers around Jimma and nearby towns. Open a job to see the work, the pay, and how to apply."
        />
        {jobs.length === 0 ? (
          <EmptyState
            title="No open jobs yet"
            text="Check back after an employer posts, or post the first one from your dashboard."
            action={
              <Link href={loginHref("/jobs/new", signedIn)} className="inline-flex rounded-xl bg-accent px-3 py-1.5 text-sm text-accent-ink">
                {signedIn ? "Post a job" : "Log in to post"}
              </Link>
            }
          />
        ) : (
          <ul className="mt-5 grid gap-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={loginHref(`/jobs/${job.id}`, signedIn)}
                  className="block rounded-xl border border-line bg-card p-5 hover:border-accent"
                >
                  <p className="text-lg">{job.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-page px-2 py-1">{job.town}</span>
                    <span className="rounded-md bg-stat-job px-2 py-1 text-stat-job-ink">{job.pay}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="how-it-works" className="mx-auto mt-16 max-w-6xl scroll-mt-24 px-4">
        <SectionIntro
          kicker="Start here"
          title="How it works"
          text="New to the site? Three steps take you from a new account to a hired crew."
        />
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          <li className="rounded-xl border border-line bg-card p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stat-job text-stat-job-ink">1</span>
            <h3 className="mt-4 text-lg">Create an account</h3>
            <p className="mt-2 text-sm leading-6 text-muted">One login covers jobs, materials, rentals, and professionals.</p>
          </li>
          <li className="rounded-xl border border-line bg-card p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stat-crew text-stat-crew-ink">2</span>
            <h3 className="mt-4 text-lg">Post or apply</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Employers spell out the work and the pay. Contractors reply with a cover message.</p>
          </li>
          <li className="rounded-xl border border-line bg-card p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stat-gear text-stat-gear-ink">3</span>
            <h3 className="mt-4 text-lg">Hire and review</h3>
            <p className="mt-2 text-sm leading-6 text-muted">After a job is accepted, both sides can leave a rating.</p>
          </li>
        </ol>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <SectionIntro
          kicker="Welcome"
          title="Who it is for"
          text="BuildLink ET is for people already working on sites in Southwest Ethiopia."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="overflow-hidden rounded-xl border border-line bg-card">
            <p className="bg-stat-job px-4 py-2 text-sm text-stat-job-ink">Contractors</p>
            <p className="p-4 text-sm leading-6">Looking for site work</p>
          </article>
          <article className="overflow-hidden rounded-xl border border-line bg-card">
            <p className="bg-stat-crew px-4 py-2 text-sm text-stat-crew-ink">Employers</p>
            <p className="p-4 text-sm leading-6">Need a mason, electrician or site engineer without a long search</p>
          </article>
          <article className="overflow-hidden rounded-xl border border-line bg-card">
            <p className="bg-stat-gear px-4 py-2 text-sm text-stat-gear-ink">Owners and sellers</p>
            <p className="p-4 text-sm leading-6">Have surplus materials or an idle mixer you want used on the next job</p>
          </article>
        </div>
      </section>

      <section id="about" className="mx-auto mt-14 max-w-6xl px-4">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <div>
            <p className="text-sm text-accent">About us</p>
            <h2 className="mt-1 text-2xl">About us</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              BuildLink ET connects construction jobs, professionals, surplus materials, and equipment rentals in Southwest Ethiopia. The pilot is in Jimma, and the same account reaches nearby towns such as Agaro, Bedele, Mettu, and Bonga. A contractor can hire a crew, list leftover materials, and rent equipment from one login.
            </p>
          </div>
          <div className="relative min-h-56 overflow-hidden rounded-xl bg-navy">
            <Image src={ABOUT_PHOTO} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-navy/40" />
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-navy p-4 text-white">
              <p className="text-sm text-white/80">Live on the Jimma pilot</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-white/70">Jobs</dt>
                  <dd className="mt-1 text-xl">{stats.jobs}</dd>
                </div>
                <div>
                  <dt className="text-white/70">Contractors</dt>
                  <dd className="mt-1 text-xl">{stats.contractors}</dd>
                </div>
                <div>
                  <dt className="text-white/70">Materials</dt>
                  <dd className="mt-1 text-xl">{stats.materials}</dd>
                </div>
                <div>
                  <dt className="text-white/70">Equipment</dt>
                  <dd className="mt-1 text-xl">{stats.equipment}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 pb-14">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href={loginHref("/jobs", signedIn)} className="rounded-xl bg-stat-crew px-4 py-4 text-stat-crew-ink">
            <span className="block text-base">Browse jobs</span>
            <span className="mt-1 block text-sm">
              Look through open site work in Jimma and nearby towns, then send an application with a short note.
            </span>
          </Link>
          <Link href={loginHref("/jobs/new", signedIn)} className="rounded-xl bg-stat-job px-4 py-4 text-stat-job-ink">
            <span className="block text-base">Post a job</span>
            <span className="mt-1 block text-sm">Describe the crew, the pay, and the town so contractors can respond.</span>
          </Link>
        </div>
      </section>
    </>
  );
}

function SectionIntro({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm text-accent">{kicker}</p>
      <h2 className="mt-1 text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-xl p-4 ${tone}`}>
      <p className="text-sm">{label}</p>
      <p className="mt-2 text-3xl">{value}</p>
    </div>
  );
}
