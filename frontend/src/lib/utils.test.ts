import { describe, it, expect } from "vitest";
import { cn, flagEmoji } from "./utils";

describe("cn utility", () => {
  it("combines simple CSS classes", () => {
    expect(cn("text-red-500", "bg-white")).toBe("text-red-500 bg-white");
  });

  it("resolves Tailwind conflicts (overrides correctly)", () => {
    expect(cn("p-2 text-black", "p-4")).toBe("text-black p-4");
  });

  it("ignores false, null, or undefined values", () => {
    const isError = false;
    expect(cn("base-class", isError && "text-red", null, undefined)).toBe(
      "base-class"
    );
  });
});

describe("flagEmoji utility", () => {
  it("returns the correct emoji for valid uppercase ISO codes", () => {
    expect(flagEmoji("RO")).toBe("🇷🇴");
    expect(flagEmoji("FR")).toBe("🇫🇷");
    expect(flagEmoji("US")).toBe("🇺🇸");
  });

  it("works correctly even with lowercase letters", () => {
    expect(flagEmoji("de")).toBe("🇩🇪");
    expect(flagEmoji("it")).toBe("🇮🇹");
  });

  it("returns a white flag (fallback) for invalid length codes", () => {
    expect(flagEmoji("ROM")).toBe("🏳️");
    expect(flagEmoji("R")).toBe("🏳️");
    expect(flagEmoji("")).toBe("🏳️");
  });
});
