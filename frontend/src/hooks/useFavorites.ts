"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "foldero-favorite-tools";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] = EMPTY;
let cacheRaw = "";

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getSnapshot(): string[] {
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      const parsed = JSON.parse(raw);
      cache = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY) listener();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(hrefs: string[]) {
  cache = hrefs;
  cacheRaw = JSON.stringify(hrefs);
  try {
    localStorage.setItem(STORAGE_KEY, cacheRaw);
  } catch {
    // storage unavailable (private browsing, quota, etc.) — favourites just won't persist
  }
  listeners.forEach((listener) => listener());
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((href: string) => {
    const current = getSnapshot();
    const next = current.includes(href)
      ? current.filter((h) => h !== href)
      : [...current, href];
    write(next);
  }, []);

  const isFavorite = useCallback((href: string) => favorites.includes(href), [favorites]);

  return { favorites, toggle, isFavorite };
}
