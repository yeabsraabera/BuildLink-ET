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

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold tracking-wide text-accent">Southwest Ethiopia</p>
      <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">BuildLink ET</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        Jobs, surplus materials, equipment rentals, and professionals. One account, starting in
        Jimma.
      </p>
      <p className="mt-3 font-display text-2xl text-foreground">
        Build smarter. Connect better. Waste less.
      </p>
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
    </div>
  );
}
