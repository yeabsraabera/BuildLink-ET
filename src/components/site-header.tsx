"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

const modules = [
  { href: "/jobs", label: "Jobs" },
  { href: "/materials", label: "Materials" },
  { href: "/rentals", label: "Rentals" },
  { href: "/professionals", label: "Professionals" },
] as const;

type Session = {
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
    <header className="border-b border-line bg-surface">
      <div className="h-1 bg-accent" />
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="font-display text-xl text-foreground">
          BuildLink ET
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Modules">
          {modules.map((item) => (
            <NavLink key={item.href} href={item.href} pathname={pathname} label={item.label} />
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            <AuthLinks ready={ready} session={session} pathname={pathname} onLogout={logout} />
          </div>
          <button
            type="button"
            className="rounded-md border border-line px-3 py-1.5 text-sm md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            Menu
          </button>
        </div>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-background px-4 py-3 md:hidden">
          <nav className="grid gap-1" aria-label="Modules">
            {modules.map((item) => (
              <NavLink key={item.href} href={item.href} pathname={pathname} label={item.label} />
            ))}
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
}: {
  href: "/jobs" | "/materials" | "/rentals" | "/professionals";
  label: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-2 py-1 text-sm ${
        active ? "bg-accent text-accent-ink" : "text-foreground hover:bg-background"
      }`}
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
    return <span className="text-sm text-muted">Account</span>;
  }

  if (!session) {
    return (
      <>
        <Link
          href="/login"
          aria-current={pathname === "/login" ? "page" : undefined}
          className="px-2 py-1 text-sm text-foreground"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-ink hover:bg-accent-hover"
        >
          Register
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="max-w-40 truncate text-sm text-muted">
        {session.name}, {session.town}
      </span>
      <Link href="/dashboard" className="px-2 py-1 text-sm text-foreground">
        Dashboard
      </Link>
      {session.isAdmin ? (
        <Link href="/admin" className="px-2 py-1 text-sm text-foreground">
          Admin
        </Link>
      ) : null}
      <button
        type="button"
        onClick={onLogout}
        className="rounded-md border border-line px-3 py-1.5 text-sm text-foreground hover:border-accent"
      >
        Logout
      </button>
    </>
  );
}
