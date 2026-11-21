"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const modules = [
  { href: "/jobs", label: "Jobs" },
  { href: "/materials", label: "Materials" },
  { href: "/rentals", label: "Rentals" },
  { href: "/professionals", label: "Professionals" },
] as const;

type Session = {
  id?: string;
  name: string;
  town: string;
  isAdmin: boolean;
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as { success?: boolean; data?: Session };
        return body.success ? (body.data ?? null) : null;
      })
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setOpenPath(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex min-w-0 max-w-6xl items-center gap-2 px-4 py-3">
        <BrandLogo className="h-20" />
        <nav className="ml-4 hidden min-w-0 items-center gap-1 md:flex" aria-label="Site">
          <NavLink href="/" pathname={pathname} label="Home" exact />
          {modules.map((item) => (
            <NavLink
              key={item.href}
              href={ready && !session ? `/login?next=${item.href}` : item.href}
              pathname={pathname}
              label={item.label}
              match={item.href}
            />
          ))}
          <NavLink href="/#how-it-works" pathname={pathname} label="How it works" />
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            <AuthLinks ready={ready} session={session} pathname={pathname} onLogout={logout} />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-xl border border-white/40 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Menu"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            <span className="block h-0.5 w-4 bg-white" />
            <span className="block h-0.5 w-4 bg-white" />
            <span className="block h-0.5 w-4 bg-white" />
          </button>
        </div>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-white/20 px-4 py-3 md:hidden">
          <nav className="grid gap-1" aria-label="Site">
            <NavLink href="/" pathname={pathname} label="Home" exact />
            {modules.map((item) => (
              <NavLink
                key={item.href}
                href={ready && !session ? `/login?next=${item.href}` : item.href}
                pathname={pathname}
                label={item.label}
                match={item.href}
              />
            ))}
            <NavLink href="/#how-it-works" pathname={pathname} label="How it works" />
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AuthLinks ready={ready} session={session} pathname={pathname} onLogout={logout} />
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  label,
  pathname,
  exact,
  match,
}: {
  href: string;
  label: string;
  pathname: string;
  exact?: boolean;
  match?: string;
}) {
  const target = match ?? href;
  const active = exact ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3 py-1 text-sm ${active ? "bg-accent text-accent-ink" : "text-white hover:bg-white/10"}`}
    >
      {label}
    </Link>
  );
}

function AuthLinks({
  ready,
  session,
  pathname,
  onLogout,
}: {
  ready: boolean;
  session: Session | null;
  pathname: string;
  onLogout: () => void;
}) {
  if (!ready) {
    return <span className="text-sm text-white/70">Account</span>;
  }

  if (!session) {
    return (
      <>
        <Link
          href="/login"
          aria-current={pathname === "/login" ? "page" : undefined}
          className="inline-flex rounded-xl border border-white px-4 py-2 text-sm text-white"
        >
          Log in
        </Link>
        <Link href="/register" className="inline-flex rounded-xl bg-accent px-4 py-2 text-sm text-accent-ink">
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href={session.id ? `/profile/${session.id}` : "/dashboard"} className="max-w-40 truncate text-sm text-white/80">
        {session.name}
      </Link>
      <Link href="/dashboard" className="px-2 py-1 text-sm text-white">
        Dashboard
      </Link>
      {session.isAdmin ? (
        <Link href="/admin" className="px-2 py-1 text-sm text-white">
          Admin
        </Link>
      ) : null}
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex rounded-xl border border-white px-4 py-2 text-sm text-white"
      >
        Logout
      </button>
    </>
  );
}
