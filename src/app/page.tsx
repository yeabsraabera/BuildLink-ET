import Link from "next/link";

const modules = [
  {
    href: "/jobs",
    title: "Jobs",
    text: "Find site work or post a vacancy.",
    className: "bg-[#9a4318] hover:bg-[#7d3513]",
  },
  {
    href: "/materials",
    title: "Materials",
    text: "List or browse surplus from real projects.",
    className: "bg-[#3f4c30] hover:bg-[#313b26]",
  },
  {
    href: "/rentals",
    title: "Rentals",
    text: "Borrow mixers, generators, and tools.",
    className: "bg-[#6e4330] hover:bg-[#583628]",
  },
  {
    href: "/professionals",
    title: "Professionals",
    text: "Meet engineers, artisans, and supervisors.",
    className: "bg-[#2c4038] hover:bg-[#22322c]",
  },
] as const;

const steps = [
  {
    title: "Sign in with one account",
    text: "Use sara@buildlink.et or dawit@buildlink.et. The shared demo password is demo123. Sara posts work. Dawit applies.",
    href: "/login",
    link: "Log in",
  },
  {
    title: "Open a job and apply",
    text: "Go to Jobs, open Junior site engineer, and send an application. A second active application to the same job is blocked.",
    href: "/jobs",
    link: "Browse jobs",
  },
  {
    title: "Inquire about surplus material",
    text: "Open Materials and send an inquiry. BuildLink ET has not inspected items. Agreed reserves the listing. Completed marks it sold and hides it.",
    href: "/materials",
    link: "Browse materials",
  },
  {
    title: "Request a mixer for dates",
    text: "Open Rentals, choose the concrete mixer, and send a start and end date. The owner can approve, reject, or mark it returned. Overlapping approvals are refused.",
    href: "/rentals",
    link: "Browse rentals",
  },
  {
    title: "Find a professional",
    text: "Each person has one profile. Send a service inquiry. The owner can request verification. Only an admin marks it reviewed.",
    href: "/professionals",
    link: "Browse professionals",
  },
  {
    title: "Manage it on the dashboard",
    text: "Update incoming requests, withdraw your own, or edit a listing. Use Report on a listing you do not own. Admins review the queue from Admin.",
    href: "/dashboard",
    link: "Open dashboard",
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold tracking-wide text-accent">Southwest Ethiopia</p>
      <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">BuildLink ET</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        Jobs, surplus materials, equipment rentals, and professionals. One account, starting in Jimma.
      </p>
      <p className="mt-3 font-display text-2xl text-foreground">Build smarter. Connect better. Waste less.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {modules.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg p-5 text-[#fffaf4] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${item.className}`}
          >
            <span className="font-display text-2xl">{item.title}</span>
            <span className="mt-2 block text-sm leading-6">{item.text}</span>
          </Link>
        ))}
      </div>
      <section className="mt-12">
        <h2 className="font-display text-3xl">Demo in six steps</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-line bg-surface p-4">
              <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
              <h3 className="mt-1 font-display text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
              <Link href={step.href} className="mt-3 inline-block text-sm font-semibold text-accent">
                {step.link}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
