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
      className="inline-flex items-center gap-2 rounded-xl border border-accent bg-transparent px-3 py-1.5 text-sm text-white"
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
      {dark ? "Light" : "Dark"}
    </button>
  );
}
