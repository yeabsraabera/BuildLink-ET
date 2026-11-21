import Link from "next/link";

import { moduleEmoji, outlineClass, pageClass, primaryClass } from "@/components/ui";

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
          <Link href="/register" className={primaryClass}>
            Create an account
          </Link>
          <Link href="/login" className={outlineClass}>
            Log in
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
    </div>
  );
}
