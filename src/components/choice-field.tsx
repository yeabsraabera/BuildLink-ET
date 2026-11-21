"use client";

import { useEffect, useId, useRef, useState } from "react";

import { fieldClass } from "@/components/ui";

export type Choice = { value: string; label: string };

export function choiceOptions(items: readonly string[]): Choice[] {
  return items.map((item) => ({ value: item, label: item }));
}

export function ChoiceField({
  name,
  options,
  defaultValue = "",
  allowOther = false,
  placeholder = "Choose",
  ariaLabel,
}: {
  name: string;
  options: Choice[];
  defaultValue?: string;
  allowOther?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const known = options.some((option) => option.value === defaultValue);
  const [value, setValue] = useState(defaultValue && !known && allowOther ? "other" : defaultValue);
  const [otherText, setOtherText] = useState(defaultValue && !known && allowOther ? defaultValue : "");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const submitted = value === "other" ? otherText.trim() : value;
  const current = value === "other" ? "Other" : options.find((option) => option.value === value)?.label || placeholder;

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function choose(next: string) {
    setValue(next);
    setOpen(false);
  }

  return (
    <div ref={root} className={`relative min-w-0 ${open ? "z-30" : ""}`}>
      <input type="hidden" name={name} value={submitted} />
      <button
        type="button"
        className={`${fieldClass} flex items-center justify-between gap-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
      >
        <span className="min-w-0 truncate">{current}</span>
        <span aria-hidden className="mt-0.5 h-0 w-0 shrink-0 border-x-4 border-t-4 border-x-transparent border-t-current" />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-line bg-card py-1"
        >
          {options.map((option) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-background ${value === option.value ? "bg-background" : ""}`}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
          {allowOther ? (
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === "other"}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-background ${value === "other" ? "bg-background" : ""}`}
                onClick={() => choose("other")}
              >
                Other
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
      {allowOther && value === "other" ? (
        <input
          className={`${fieldClass} mt-2`}
          value={otherText}
          onChange={(event) => setOtherText(event.target.value)}
          placeholder="Type your own"
          aria-label={ariaLabel ? `${ariaLabel}, other` : "Other"}
          required
          minLength={2}
          maxLength={80}
        />
      ) : null}
    </div>
  );
}
