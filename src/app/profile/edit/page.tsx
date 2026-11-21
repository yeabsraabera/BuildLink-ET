"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { errorText, readApi } from "@/components/api-client";
import { ChoiceField } from "@/components/choice-field";
import { fieldClass, linkClass, pageClass, primaryClass } from "@/components/ui";

type Town = { id: string; name: string };
type Profile = {
  id: string;
  name: string;
  town: string;
  role: "contractor" | "employer" | "both";
  headline: string;
  bio: string;
  skills: string[];
  experience: { title: string; company: string; years: string; description: string }[];
  avatarUrl?: string;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [towns, setTowns] = useState<Town[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then((response) => readApi<{ id: string }>(response)),
      fetch("/api/locations", { cache: "no-store" }).then((response) => readApi<Town[]>(response)),
    ])
      .then(async ([me, locations]) => {
        if (cancelled) return;
        if (!me.success || !me.data) {
          setState("error");
          setMessage("Sign in to edit your profile.");
          return;
        }
        if (locations.success && locations.data) setTowns(locations.data);
        const body = await fetch(`/api/users/${me.data.id}`, { cache: "no-store" }).then((response) =>
          readApi<Profile>(response),
        );
        if (!body.success || !body.data) {
          setState("error");
          setMessage(errorText(body, "Could not load your profile"));
          return;
        }
        setProfile(body.data);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          setMessage("Could not load your profile");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const experience = [0, 1, 2]
      .map((index) => ({
        title: String(form.get(`exp-title-${index}`) || "").trim(),
        company: String(form.get(`exp-company-${index}`) || "").trim(),
        years: String(form.get(`exp-years-${index}`) || "").trim(),
        description: String(form.get(`exp-description-${index}`) || "").trim(),
      }))
      .filter((item) => item.title && item.company && item.years);
    const skills = String(form.get("skills") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          town: form.get("town"),
          role: form.get("role"),
          headline: form.get("headline"),
          bio: form.get("bio"),
          skills,
          experience,
          avatarUrl: String(form.get("avatarUrl") || ""),
        }),
      });
      const body = await readApi<{ id: string }>(response);
      if (!response.ok || !body.success || !body.data) {
        setMessage(errorText(body, "Could not save"));
        return;
      }
      router.push(`/profile/${body.data.id}`);
    } catch {
      setMessage("Could not save");
    } finally {
      setPending(false);
    }
  }

  const rows = [...(profile?.experience ?? []), { title: "", company: "", years: "", description: "" }].slice(0, 3);
  while (rows.length < 3) rows.push({ title: "", company: "", years: "", description: "" });

  return (
    <div className={`${pageClass} max-w-2xl py-8`}>
      <Link href={profile ? `/profile/${profile.id}` : "/dashboard"} className={`text-sm ${linkClass}`}>
        Back to profile
      </Link>
      <h1 className="mt-3 text-2xl">Edit profile</h1>
      {state === "loading" ? <p className="mt-4 text-sm text-muted">Loading...</p> : null}
      {state === "error" ? (
        <p className="mt-4 rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}
      {state === "ready" && profile ? (
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm">
            Name
            <input className={fieldClass} name="name" required defaultValue={profile.name} />
          </label>
          <div className="grid gap-1 text-sm">
            <span>Town</span>
            <ChoiceField
              name="town"
              options={(towns.some((town) => town.name === profile.town) ? towns : [{ id: "current", name: profile.town }, ...towns]).map(
                (town) => ({ value: town.name, label: town.name }),
              )}
              defaultValue={profile.town}
              allowOther
              ariaLabel="Town"
            />
          </div>
          <div className="grid gap-1 text-sm">
            <span>Role</span>
            <ChoiceField
              name="role"
              options={[
                { value: "contractor", label: "Contractor" },
                { value: "employer", label: "Employer" },
                { value: "both", label: "Both" },
              ]}
              defaultValue={profile.role}
              ariaLabel="Role"
            />
          </div>
          <label className="grid gap-1 text-sm">
            Headline
            <input className={fieldClass} name="headline" defaultValue={profile.headline} />
          </label>
          <label className="grid gap-1 text-sm">
            Bio
            <textarea className={fieldClass} name="bio" rows={4} defaultValue={profile.bio} />
          </label>
          <label className="grid gap-1 text-sm">
            Skills, separated by commas
            <input className={fieldClass} name="skills" defaultValue={profile.skills.join(", ")} />
          </label>
          <label className="grid gap-1 text-sm">
            Avatar URL
            <input className={fieldClass} name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} />
          </label>
          <p className="text-sm">Experience</p>
          {rows.map((item, index) => (
            <fieldset key={index} className="grid gap-2 rounded-xl border border-line p-3">
              <label className="grid gap-1 text-sm">
                Title
                <input className={fieldClass} name={`exp-title-${index}`} defaultValue={item.title} />
              </label>
              <label className="grid gap-1 text-sm">
                Company
                <input className={fieldClass} name={`exp-company-${index}`} defaultValue={item.company} />
              </label>
              <label className="grid gap-1 text-sm">
                Years
                <input className={fieldClass} name={`exp-years-${index}`} defaultValue={item.years} placeholder="2019 to 2022" />
              </label>
              <label className="grid gap-1 text-sm">
                Description
                <textarea className={fieldClass} name={`exp-description-${index}`} rows={2} defaultValue={item.description} />
              </label>
            </fieldset>
          ))}
          {message ? (
            <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
              {message}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className={primaryClass}>
            {pending ? "Saving..." : "Save"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
