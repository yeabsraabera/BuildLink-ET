import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { getSessionUser } from "@/lib/auth";
import { loadHomeContent } from "@/lib/home";

const HERO =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80";
const CARD_HIRE =
  "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?auto=format&fit=crop&w=900&q=80";
const CARD_JOBS =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80";
const CARD_RENT =
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80";

const introCards = [
  {
    href: "/register",
    image: CARD_HIRE,
    title: "Hire skilled contractors",
    text: "Find masons, electricians, and site engineers who already work in Jimma and nearby towns.",
  },
  {
    href: "/register",
    image: CARD_JOBS,
    title: "Find construction jobs",
    text: "See what the site needs, what it pays, and apply with a short cover message.",
  },
  {
    href: "/register",
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
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm text-accent-ink hover:bg-accent-hover"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-xl border border-white px-5 py-2.5 text-sm text-white hover:bg-white/10"
            >
              Log in
            </Link>
          </div>
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

async function LiveHome() {
  await connection();
  const signedIn = Boolean(await getSessionUser());
  const { stats, contractors, jobs } = await loadHomeContent();
  const jobHref = (id: string) => (signedIn ? `/jobs/${id}` : `/login?next=/jobs/${id}`);
  const profileHref = (id: string) => (signedIn ? `/profile/${id}` : `/login?next=/profile/${id}`);

  return (
    <>
      <section className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
        <Stat label="Open jobs" value={stats.jobs} />
        <Stat label="Contractors" value={stats.contractors} />
        <Stat label="Materials" value={stats.materials} />
        <Stat label="Equipment" value={stats.equipment} />
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-2xl">Featured contractors</h2>
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
                <Link href={profileHref(person.id)} className="mt-4 inline-flex rounded-xl bg-accent px-3 py-1.5 text-sm text-accent-ink">
                  View profile
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-2xl">Latest jobs</h2>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No open jobs yet.</p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link href={jobHref(job.id)} className="block rounded-xl border border-line bg-card p-4 hover:bg-page">
                  <p>{job.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {job.town} · {job.pay} · {job.employmentType}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="how-it-works" className="mx-auto mt-16 max-w-6xl px-4">
        <h2 className="text-2xl">How it works</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          <li className="rounded-xl border border-line bg-card p-4">
            <p className="text-sm text-muted">1</p>
            <h3 className="mt-1 text-lg">Create an account</h3>
            <p className="mt-2 text-sm leading-6 text-muted">One login for jobs, materials, rentals, and professionals.</p>
          </li>
          <li className="rounded-xl border border-line bg-card p-4">
            <p className="text-sm text-muted">2</p>
            <h3 className="mt-1 text-lg">Post or apply</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Employers describe the work and the pay. Contractors send a cover message.</p>
          </li>
          <li className="rounded-xl border border-line bg-card p-4">
            <p className="text-sm text-muted">3</p>
            <h3 className="mt-1 text-lg">Hire and review</h3>
            <p className="mt-2 text-sm leading-6 text-muted">After an accepted job, both sides can leave a rating.</p>
          </li>
        </ol>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-2xl">Who it is for</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <p className="rounded-xl border border-line bg-card p-4 text-sm leading-6">
            Contractors looking for site work in Jimma, Agaro, Bedele, Mettu, and Bonga.
          </p>
          <p className="rounded-xl border border-line bg-card p-4 text-sm leading-6">
            Employers who need a mason, electrician, or site engineer without a long search.
          </p>
          <p className="rounded-xl border border-line bg-card p-4 text-sm leading-6">
            Crews with surplus materials or idle mixers who want them used on the next job.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="rounded-xl bg-navy p-6 text-white">
          <p>No payments are handled here.</p>
          <p className="mt-2 text-sm text-white/80">Listings can be reviewed by an admin. This is a prototype for Southwest Ethiopia.</p>
        </div>
      </section>

      <section className="mt-14 bg-navy px-4 py-12 text-center text-white">
        <h2 className="text-2xl">Ready to get on site?</h2>
        <p className="mt-2 text-sm text-white/80">Create a free account and post or apply today.</p>
        <Link href="/register" className="mt-5 inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm text-accent-ink">
          Create free account
        </Link>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl">{value}</p>
    </div>
  );
}
