import { useContext } from "react";

import { TimezoneContext } from "@/lib/timezone-context";

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return ctx;
}
