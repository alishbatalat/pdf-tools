"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export default function FavoriteButton({
  href,
  size = 18,
  className = "",
}: {
  href: string;
  size?: number;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(href);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={active}
      className={`favorite-button ${active ? "is-active" : ""} ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(href);
      }}
    >
      <Star size={size} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
