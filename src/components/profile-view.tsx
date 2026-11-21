"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { errorText, readApi } from "@/components/api-client";
import { linkClass, outlineClass, pageClass } from "@/components/ui";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt?: string;
  reviewer: { id: string; name: string; town: string };
};

type Profile = {
  id: string;
  name: string;
  town: string;
  role: string;
  headline: string;
  bio: string;
  skills: string[];
  experience: { title: string; company: string; years: string; description: string }[];
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  isSelf: boolean;
  reviews: ReviewItem[];
  jobs: { id: string; title: string; town: string }[];
};

export function ProfileView({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}`, { cache: "no-store" })
      .then((response) => readApi<Profile>(response))
      .then((body) => {
        if (cancelled) return;
        if (!body.success || !body.data) {
          setState("error");
          setMessage(errorText(body, "Could not load this profile"));
          return;
        }
        setProfile(body.data);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          setMessage("Could not load this profile");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className={`${pageClass} max-w-3xl py-8`}>
      {state === "loading" ? <p className="text-sm text-muted">Loading profile...</p> : null}
      {state === "error" ? (
        <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}
      {state === "ready" && profile ? (
        <article>
          <div className="flex flex-wrap items-start gap-4">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-20 w-20 rounded-xl bg-navy object-cover ring-2 ring-line" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-navy text-white">
                {profile.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl">{profile.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {profile.headline || profile.role} · {profile.town}
              </p>
              <p className="mt-1 text-sm">
                {profile.reviewCount > 0
                  ? `${profile.rating} stars · ${profile.reviewCount} reviews`
                  : "No reviews yet"}
              </p>
              <span className="mt-2 inline-flex rounded-md border border-line bg-page px-2 py-1 text-xs text-muted">{profile.role}</span>
            </div>
            {profile.isSelf ? (
              <Link href="/profile/edit" className={`${outlineClass} ml-auto`}>
                Edit profile
              </Link>
            ) : null}
          </div>
          {profile.bio ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7">{profile.bio}</p> : null}
          {profile.skills.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-md bg-page px-2 py-1 text-xs text-muted">
                  {skill}
                </span>
              ))}
            </div>
          ) : null}

          <section className="mt-8">
            <h2 className="text-xl">Experience</h2>
            {profile.experience.length === 0 ? <p className="mt-2 text-sm text-muted">No experience listed yet.</p> : null}
            <ol className="mt-3 grid gap-3">
              {profile.experience.map((item) => (
                <li key={`${item.title}-${item.company}`} className="rounded-xl border border-line bg-card p-4">
                  <p>{item.title}</p>
                  <p className="text-sm text-muted">
                    {item.company} · {item.years}
                  </p>
                  {item.description ? <p className="mt-2 text-sm leading-6">{item.description}</p> : null}
                </li>
              ))}
            </ol>
          </section>

          {profile.jobs.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xl">Open jobs</h2>
              <ul className="mt-3 grid gap-2">
                {profile.jobs.map((job) => (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}`} className={linkClass}>
                      {job.title}
                    </Link>
                    <span className="text-sm text-muted"> · {job.town}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="text-xl">Reviews</h2>
            {profile.reviews.length === 0 ? <p className="mt-2 text-sm text-muted">No reviews yet.</p> : null}
            <ul className="mt-3 grid gap-3">
              {profile.reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-line bg-card p-4">
                  <p className="text-sm">
                    <Link href={`/profile/${review.reviewer.id}`} className={linkClass}>
                      {review.reviewer.name}
                    </Link>
                    <span className="text-muted">
                      {" "}
                      · {review.rating} stars
                      {review.createdAt ? ` · ${review.createdAt.slice(0, 10)}` : ""}
                    </span>
                  </p>
                  <p className="mt-2 text-sm leading-6">{review.comment}</p>
                </li>
              ))}
            </ul>
          </section>
        </article>
      ) : null}
    </div>
  );
}
