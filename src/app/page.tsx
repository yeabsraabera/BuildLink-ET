import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { getSessionUser } from "@/lib/auth";
import { loadHomeContent } from "@/lib/home";

const HERO =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80";
const CARD_HIRE =
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80";
const CARD_JOBS =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80";
const CARD_RENT =
  "https://images.unsplash.com/photo-1517089152318-42ec560349c0?auto=format&fit=crop&w=900&q=80";

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
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative mx-auto flex min-h-[34rem] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="max-w-3xl text-4xl leading-tight tracking-tight sm:text-5xl">
            Build Smarter. Connect Better. Waste Less.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
            Jobs, contractors, surplus materials and equipment rentals across Southwest Ethiopia
          </p>
          <Suspense fallback={<div className="mt-8 h-11" />}>
            <HeroCtas />
          </Suspense>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-14 grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
        {introCards.map((card) => (
          <article key={card.title} className="overflow-hidden rounded-xl border border-line bg-card fade-in">
            <div className="relative h-40 bg-navy">
              <Image src={card.image} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
            <div className="p-4">
              <h2 className="text-lg">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{card.text}</p>
              <Link href={card.href} className="mt-3 inline-block text-sm text-accent-ink bg-accent rounded-xl px-3 py-1.5">
                Read more
              </Link>
            </div>
          </article>
        ))}
      </div>

      <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted">Loading live numbers...</p>}>
        <LiveHome />
      </Suspense>
    </div>
  );
}

async function HeroCtas() {
  await connection();
  const signedIn = Boolean(await getSessionUser());
  if (signedIn) {
    return (
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm text-accent-ink hover:bg-accent-hover">
          Go to dashboard
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link href="/register" className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm text-accent-ink hover:bg-accent-hover">
        Create account
      </Link>
      <Link href="/login" className="inline-flex rounded-xl border border-white px-5 py-2.5 text-sm text-white hover:bg-white/10">
        Log in
      </Link>
    </div>
  );
}

async function LiveHome() {
  await connection();
  const { stats, contractors, jobs } = await loadHomeContent();

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
          <p className="mt-3 text-sm text-muted">No contractor profiles are public yet.</p>
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
                <p className="mt-3 text-sm text-muted">
                  {person.reviewCount > 0
                    ? `${person.rating.toFixed(1)} stars · ${person.reviewCount} reviews`
                    : "No reviews yet"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {person.skills.map((skill) => (
                    <span key={skill} className="rounded-md border border-line bg-page px-2 py-1 text-xs text-muted">
                      {skill}
                    </span>
                  ))}
                </div>
                <Link href={`/profile/${person.id}`} className="mt-4 inline-flex rounded-xl bg-accent px-3 py-1.5 text-sm text-accent-ink">
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
          <p className="mt-5 text-sm text-muted">No open jobs yet. Check back after an employer posts.</p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link href={`/jobs/${job.id}`} className="block rounded-xl border border-line bg-card p-5 hover:border-accent">
                  <p className="text-lg">{job.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-page px-2 py-1">{job.town}</span>
                    <span className="rounded-md bg-stat-job px-2 py-1 text-stat-job-ink">{job.pay}</span>
                    <span className="rounded-md border border-line px-2 py-1">{job.employmentType}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="how-it-works" className="mx-auto mt-16 max-w-6xl px-4">
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
            <p className="p-4 text-sm leading-6">Looking for site work in Jimma, Agaro, Bedele, Mettu, or Bonga.</p>
          </article>
          <article className="overflow-hidden rounded-xl border border-line bg-card">
            <p className="bg-stat-crew px-4 py-2 text-sm text-stat-crew-ink">Employers</p>
            <p className="p-4 text-sm leading-6">Need a mason, electrician, or site engineer without a long search.</p>
          </article>
          <article className="overflow-hidden rounded-xl border border-line bg-card">
            <p className="bg-stat-gear px-4 py-2 text-sm text-stat-gear-ink">Crews</p>
            <p className="p-4 text-sm leading-6">Have surplus materials or an idle mixer you want used on the next job.</p>
          </article>
        </div>
      </section>

      <section id="about" className="mx-auto mt-14 max-w-6xl px-4">
        <SectionIntro
          kicker="About us"
          title="About us"
          text="BuildLink ET connects construction jobs, professionals, surplus materials, and equipment rentals in Southwest Ethiopia. The pilot is in Jimma, and the same account reaches nearby towns such as Agaro, Bedele, Mettu, and Bonga. A contractor can hire a crew, list leftover materials, and rent equipment from one login."
        />
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 pb-14">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/jobs" className="rounded-xl bg-stat-crew px-4 py-4 text-stat-crew-ink">
            <span className="block text-base">Browse jobs</span>
            <span className="mt-1 block text-sm">
              Look through open site work in Jimma and nearby towns, then send an application with a short note.
            </span>
          </Link>
          <Link href="/jobs/new" className="rounded-xl bg-stat-job px-4 py-4 text-stat-job-ink">
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
