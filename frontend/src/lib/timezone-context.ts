import { createContext } from "react";

export interface TimezoneContextValue {
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
}

export const TimezoneContext = createContext<TimezoneContextValue | null>(null);
