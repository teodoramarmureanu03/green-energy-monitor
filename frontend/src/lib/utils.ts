import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
