"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { errorText, readApi } from "@/components/api-client";
import { ChoiceField, choiceOptions } from "@/components/choice-field";
import { detailText, type ListingCard, type LocationOption } from "@/components/listing-types";
import { fieldClass, linkClass, primaryClass } from "@/components/ui";
import {
  availabilityValues,
  deliveryOptions,
  jobEmployment,
  jobExperience,
  materialConditions,
  moduleMeta,
  payTypes,
  pricePeriods,
  rentalConditions,
} from "@/lib/modules";
import type { ListingType } from "@/lib/status";

const inputClass = fieldClass;

export function ListingForm({ type, mode, id }: { type: ListingType; mode: "create" | "edit"; id?: string }) {
  const meta = moduleMeta[type];
  const router = useRouter();
  const [places, setPlaces] = useState<LocationOption[]>([]);
  const [listing, setListing] = useState<ListingCard | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const listingRequest =
      mode === "edit" && id
        ? fetch(`/api/listings/${id}`, { cache: "no-store" }).then((response) => readApi<ListingCard>(response))
        : Promise.resolve(null);
    Promise.all([
      fetch("/api/locations", { cache: "no-store" }).then((response) => readApi<LocationOption[]>(response)),
      listingRequest,
      fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.ok),
    ])
      .then(async ([locations, existing, signedIn]) => {
        if (cancelled) return;
        if (!signedIn) {
          setState("error");
          setMessage("Sign in to continue.");
          return;
        }
        if (locations.success && locations.data) setPlaces(locations.data);
        if (mode === "create" && type === "professional") {
          const mine = await fetch("/api/listings?type=professional&mine=true", { cache: "no-store" }).then((response) =>
            readApi<{ items: ListingCard[] }>(response),
          );
          const current = mine.data?.items.find((item) => item.status !== "Removed");
          if (current) {
            router.replace(`/professionals/${current.id}/edit`);
            return;
          }
        }
        if (mode === "edit") {
          if (!existing?.success || !existing.data) {
            setState("error");
            setMessage(existing ? errorText(existing, "Could not load this listing") : "Could not load this listing");
            return;
          }
          if (!existing.data.isOwner) {
            setState("error");
            setMessage("Only the owner can edit this listing.");
            return;
          }
          setListing(existing.data);
        }
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          setMessage("Could not load the form");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [type, mode, id, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      let locationId = String(form.get("locationId") || "").trim();
      if (!/^[a-f\d]{24}$/i.test(locationId)) {
        const townResponse = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: locationId }),
        });
        const town = await readApi<{ id: string }>(townResponse);
        if (!townResponse.ok || !town.success || !town.data) {
          setMessage(errorText(town, "Could not save that town"));
          return;
        }
        locationId = town.data.id;
      }
      const details = buildDetails(type, form);
      const body = {
        type,
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        category: String(form.get("category") || ""),
        locationId,
        imageUrl: String(form.get("imageUrl") || ""),
        details,
      };
      const response = await fetch(mode === "edit" && id ? `/api/listings/${id}` : "/api/listings", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "edit" ? { ...body, type: undefined } : body),
      });
      const result = await readApi<ListingCard>(response);
      if (!response.ok || !result.success || !result.data) {
        setMessage(errorText(result, "Could not save"));
        return;
      }
      router.push(`${meta.path}/${result.data.id}`);
      router.refresh();
    } catch {
      setMessage("Could not save");
    } finally {
      setPending(false);
    }
  }

  const categories = meta.categories;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl px-4 py-8">
      <Link href={meta.path} className={`text-sm ${linkClass}`}>
        Back to {meta.title.toLowerCase()}
      </Link>
      <h1 className="mt-3 text-2xl">{mode === "edit" ? "Edit listing" : meta.post}</h1>
      {type === "material" ? (
        <p className="mt-2 text-sm text-muted">BuildLink ET has not inspected items. Describe the condition honestly.</p>
      ) : null}
      {state === "loading" ? <p className="mt-6 text-muted">Loading form...</p> : null}
      {state === "error" ? (
        <p className="mt-6 rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
          {message}{" "}
          {message.startsWith("Sign in") ? (
            <Link href="/login" className={linkClass}>
              Log in
            </Link>
          ) : null}
        </p>
      ) : null}
      {state === "ready" ? (
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <Field label="Title">
            <input className={inputClass} name="title" required minLength={3} defaultValue={listing?.title} />
          </Field>
          <Field label="Description">
            <textarea className={inputClass} name="description" required minLength={10} rows={5} defaultValue={listing?.description} />
          </Field>
          <Field label="Category">
            <ChoiceField
              name="category"
              options={choiceOptions(categories)}
              defaultValue={listing?.category ?? categories[0] ?? ""}
              allowOther
              placeholder="Choose a category"
              ariaLabel="Category"
            />
          </Field>
          <Field label="Town">
            <ChoiceField
              name="locationId"
              options={places.map((place) => ({ value: place.id, label: place.name }))}
              defaultValue={listing?.location.id ?? places[0]?.id ?? ""}
              allowOther
              placeholder="Choose a town"
              ariaLabel="Town"
            />
          </Field>
          <Field label="Image URL (optional)">
            <input className={inputClass} name="imageUrl" type="url" defaultValue={listing?.imageUrl ?? ""} placeholder="https://" />
          </Field>
          <TypeFields type={type} listing={listing} />
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1 text-sm">
      <span>{label}</span>
      {children}
    </div>
  );
}

function TypeFields({ type, listing }: { type: ListingType; listing: ListingCard | null }) {
  const details = listing?.details ?? {};
  if (type === "job") {
    return (
      <>
        <Field label="Experience">
          <ChoiceField name="experienceLevel" options={choiceOptions(jobExperience)} defaultValue={detailText(details, "experienceLevel") || "junior"} allowOther ariaLabel="Experience" />
        </Field>
        <Field label="Employment">
          <ChoiceField name="employmentType" options={choiceOptions(jobEmployment)} defaultValue={detailText(details, "employmentType") || "contract"} allowOther ariaLabel="Employment" />
        </Field>
        <Field label="Workers needed">
          <input className={inputClass} name="workersNeeded" type="number" min="1" required defaultValue={detailText(details, "workersNeeded") || "1"} />
        </Field>
        <Field label="Duration">
          <input className={inputClass} name="duration" required defaultValue={detailText(details, "duration") || "3 months"} />
        </Field>
        <Field label="Start date">
          <input className={inputClass} name="startDate" type="date" defaultValue={detailText(details, "startDate")} />
        </Field>
        <Field label="Pay type">
          <ChoiceField
            name="payType"
            options={choiceOptions(payTypes)}
            defaultValue={detailText(details, "payType") || (details.salaryNegotiable ? "negotiable" : "per month")}
            allowOther
            ariaLabel="Pay type"
          />
        </Field>
        <Field label="Pay amount in ETB">
          <input className={inputClass} name="payAmount" type="number" min="0" defaultValue={detailText(details, "payAmount") || detailText(details, "salaryAmount")} />
        </Field>
        <Field label="Pay min in ETB">
          <input className={inputClass} name="payMin" type="number" min="0" defaultValue={detailText(details, "payMin")} />
        </Field>
        <Field label="Pay max in ETB">
          <input className={inputClass} name="payMax" type="number" min="0" defaultValue={detailText(details, "payMax")} />
        </Field>
        <Field label="Application deadline">
          <input className={inputClass} name="applicationDeadline" type="date" defaultValue={detailText(details, "applicationDeadline")} />
        </Field>
        <Field label="Required skills, separated by commas">
          <input className={inputClass} name="skills" required defaultValue={detailText(details, "skills")} />
        </Field>
      </>
    );
  }
  if (type === "material") {
    return (
      <>
        <Field label="Condition">
          <ChoiceField name="condition" options={choiceOptions(materialConditions)} defaultValue={detailText(details, "condition") || materialConditions[0]} allowOther ariaLabel="Condition" />
        </Field>
        <Field label="Quantity">
          <input className={inputClass} name="quantity" type="number" min="0.01" step="any" required defaultValue={detailText(details, "quantity")} />
        </Field>
        <Field label="Unit">
          <input className={inputClass} name="unit" required defaultValue={detailText(details, "unit") || "piece"} />
        </Field>
        <Field label="Price in ETB">
          <input className={inputClass} name="price" type="number" min="0" step="any" required defaultValue={detailText(details, "price")} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="negotiable" defaultChecked={details.negotiable !== false} />
          Price is negotiable
        </label>
        <Field label="Delivery">
          <ChoiceField name="deliveryOption" options={choiceOptions(deliveryOptions)} defaultValue={detailText(details, "deliveryOption") || "pickup"} allowOther ariaLabel="Delivery" />
        </Field>
      </>
    );
  }
  if (type === "rental") {
    return (
      <>
        <Field label="Price in ETB">
          <input className={inputClass} name="price" type="number" min="0" step="any" required defaultValue={detailText(details, "price")} />
        </Field>
        <Field label="Price period">
          <ChoiceField name="pricePeriod" options={choiceOptions(pricePeriods)} defaultValue={detailText(details, "pricePeriod") || "daily"} allowOther ariaLabel="Price period" />
        </Field>
        <Field label="Condition">
          <ChoiceField name="condition" options={choiceOptions(rentalConditions)} defaultValue={detailText(details, "condition") || "Good"} allowOther ariaLabel="Condition" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="operatorIncluded" defaultChecked={details.operatorIncluded === true} />
          Operator included
        </label>
      </>
    );
  }
  return (
    <>
      <Field label="Headline">
        <input className={inputClass} name="headline" required minLength={3} defaultValue={detailText(details, "headline")} />
      </Field>
      <Field label="Profession">
        <input className={inputClass} name="profession" required defaultValue={detailText(details, "profession")} />
      </Field>
      <Field label="Skills, separated by commas">
        <input className={inputClass} name="skills" defaultValue={detailText(details, "skills")} />
      </Field>
      <Field label="Availability">
        <ChoiceField name="availability" options={choiceOptions(availabilityValues)} defaultValue={detailText(details, "availability") || "Available"} allowOther ariaLabel="Availability" />
      </Field>
    </>
  );
}

function skillsOf(form: FormData) {
  const skills = String(form.get("skills") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return skills.length > 0 ? skills : undefined;
}

function optionalNumber(form: FormData, name: string) {
  const raw = String(form.get(name) || "").trim();
  if (!raw) return undefined;
  return Number(raw);
}

function buildDetails(type: ListingType, form: FormData) {
  if (type === "job") {
    const payType = String(form.get("payType") || "negotiable");
    const payAmount = optionalNumber(form, "payAmount");
    return {
      experienceLevel: form.get("experienceLevel"),
      employmentType: form.get("employmentType"),
      workersNeeded: optionalNumber(form, "workersNeeded"),
      duration: String(form.get("duration") || "") || undefined,
      startDate: String(form.get("startDate") || "") || undefined,
      payType,
      payAmount,
      payMin: optionalNumber(form, "payMin"),
      payMax: optionalNumber(form, "payMax"),
      salaryNegotiable: payType === "negotiable",
      salaryAmount: payAmount,
      currency: "ETB",
      applicationDeadline: String(form.get("applicationDeadline") || "") || undefined,
      skills: skillsOf(form),
    };
  }
  if (type === "material") {
    return {
      condition: form.get("condition"),
      quantity: Number(form.get("quantity")),
      unit: form.get("unit"),
      price: Number(form.get("price")),
      currency: "ETB",
      negotiable: form.get("negotiable") === "on",
      deliveryOption: form.get("deliveryOption"),
    };
  }
  if (type === "rental") {
    return {
      price: Number(form.get("price")),
      currency: "ETB",
      pricePeriod: form.get("pricePeriod"),
      condition: form.get("condition"),
      operatorIncluded: form.get("operatorIncluded") === "on",
    };
  }
  return {
    headline: form.get("headline"),
    profession: form.get("profession"),
    skills: skillsOf(form),
    availability: form.get("availability"),
  };
}
