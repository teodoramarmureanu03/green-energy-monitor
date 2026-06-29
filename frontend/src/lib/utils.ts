import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Culoare pentru harta choropleth în funcție de % regenerabil. */
export function shareToColor(pct: number): string {
  if (pct >= 70) return "#15803d";
  if (pct >= 55) return "#22c55e";
  if (pct >= 40) return "#86efac";
  if (pct >= 25) return "#d9f99d";
  return "#e4e4e7";
}

/** Emoji-steag dintr-un cod ISO de 2 litere (ex. "RO" -> 🇷🇴). */
export function flagEmoji(isoCode: string): string {
  if (isoCode.length !== 2) return "🏳️";
  const codePoints = isoCode
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}