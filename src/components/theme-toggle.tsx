"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "buildlink-theme";
const THEME_EVENT = "buildlink-theme-change";

export type ThemeName = "dark" | "light";

function readSaved(): ThemeName {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode can block storage */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

function paintSavedTheme() {
  const theme = readSaved();
  const root = document.documentElement;
  if (root.getAttribute("data-theme") !== theme) root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeSync() {
  useEffect(() => {
    paintSavedTheme();
    const observer = new MutationObserver(() => {
      const theme = readSaved();
      const root = document.documentElement;
      if (root.getAttribute("data-theme") !== theme || root.classList.contains("dark") !== (theme === "dark")) {
        root.setAttribute("data-theme", theme);
        root.classList.toggle("dark", theme === "dark");
        root.style.colorScheme = theme;
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    return () => observer.disconnect();
  }, []);
  return null;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  function toggle() {
    applyTheme(dark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 text-white hover:bg-white/10"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  );
}
