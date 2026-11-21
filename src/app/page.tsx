import Link from "next/link";

import { linkClass, moduleEmoji, outlineClass, pageClass, primaryClass } from "@/components/ui";

const modules = [
  {
    href: "/jobs",
    type: "job",
    title: "Jobs",
    text: "Find site work or post a vacancy.",
  },
  {
    href: "/materials",
    type: "material",
    title: "Materials",
    text: "List or browse surplus from real projects.",
  },
  {
    href: "/rentals",
    type: "rental",
    title: "Rentals",
    text: "Borrow mixers, generators, and tools.",
  },
  {
    href: "/professionals",
    type: "professional",
    title: "Professionals",
    text: "Meet engineers, artisans, and supervisors.",
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
    <div className={`${pageClass} py-10 sm:py-14`}>
      <section className="max-w-2xl">
        <h1 className="text-3xl leading-tight tracking-tight sm:text-4xl">
          Build smarter. Connect better. Waste less.
        </h1>
        <p className="mt-3 text-base leading-6 text-muted">
          Jobs, surplus materials, equipment rentals, and professionals. One account, starting in Jimma.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login" className={primaryClass}>
            Try the demo
          </Link>
          <Link href="/jobs" className={outlineClass}>
            Browse jobs
          </Link>
        </div>
      </section>

      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {modules.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="min-w-0 rounded-xl border border-line bg-card p-4 hover:bg-background"
          >
            <span className="text-2xl" aria-hidden>
              {moduleEmoji[item.type]}
            </span>
            <span className="mt-3 block text-base">{item.title}</span>
            <span className="mt-1 block text-sm leading-5 text-muted">{item.text}</span>
          </Link>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl">Demo in six steps</h2>
        <ol className="mt-4 grid gap-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex min-w-0 gap-3">
              <span className="w-6 shrink-0 text-sm text-muted">{index + 1}</span>
              <div className="min-w-0">
                <h3 className="text-base">{step.title}</h3>
                <p className="mt-1 break-words text-sm leading-6 text-muted">{step.text}</p>
                <Link href={step.href} className={`mt-2 inline-block text-sm ${linkClass}`}>
                  {step.link}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
