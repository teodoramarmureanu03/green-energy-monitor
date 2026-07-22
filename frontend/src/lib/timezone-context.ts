import { createContext } from "react";

import type { TimezoneOption } from "@/lib/timezones";

export interface TimezoneContextValue {
  countryIso: string;
  timeZone: string;
  option: TimezoneOption;
  setCountryIso: (isoCode: string) => void;
}

export const TimezoneContext = createContext<TimezoneContextValue | null>(null);
