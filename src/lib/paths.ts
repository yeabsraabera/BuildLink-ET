export function safeNextPath(value: string | null | undefined) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/login") || value.startsWith("/register")) return "/dashboard";
  return value;
}

export function loginHref(path: string, signedIn: boolean) {
  if (signedIn) return path;
  return `/login?next=${encodeURIComponent(path)}`;
}

export function continuePageLabel(path: string) {
  const clean = path.split("?")[0] || path;
  if (clean === "/jobs" || clean.startsWith("/jobs/")) return "Jobs";
  if (clean === "/materials" || clean.startsWith("/materials/")) return "Materials";
  if (clean === "/rentals" || clean.startsWith("/rentals/")) return "Rentals";
  if (clean === "/professionals" || clean.startsWith("/professionals/")) return "Professionals";
  if (clean.startsWith("/dashboard")) return "your dashboard";
  if (clean.startsWith("/profile")) return "the profile";
  if (clean.startsWith("/admin")) return "Admin";
  return "that page";
}
