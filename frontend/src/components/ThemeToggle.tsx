"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const eventName = "foldero-theme-change";
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  function sync() {
    let saved: string | null = null;
    try { saved = localStorage.getItem("foldero-theme"); } catch {}
    document.documentElement.dataset.theme = saved === "light" || saved === "dark" ? saved : media.matches ? "dark" : "light";
    callback();
  }
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", sync);
  media.addEventListener("change", sync);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", sync);
    media.removeEventListener("change", sync);
  };
}
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as Theme);
  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("foldero-theme", next); } catch {}
    window.dispatchEvent(new Event(eventName));
  }
  return <button type="button" className="theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
