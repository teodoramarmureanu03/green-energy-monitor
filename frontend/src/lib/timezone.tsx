import { useEffect, useState, type ReactNode } from "react";

import { fetchViewerTimezone, saveViewerTimezone } from "@/lib/api";
import { ALL_TIMEZONES, getUserLocalTimezone } from "@/lib/timezones";
import { TimezoneContext } from "@/lib/timezone-context";

const STORAGE_KEY = "eu-renewables-timezone-iana";

function getStoredTimezone(): string {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && ALL_TIMEZONES.includes(stored)) {
    return stored;
  }

  return getUserLocalTimezone();
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timeZone, setTimeZoneState] = useState(getStoredTimezone);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, timeZone);
  }, [timeZone]);

  useEffect(() => {
    let cancelled = false;

    fetchViewerTimezone()
      .then((preference) => {
        if (cancelled || !preference?.timeZone) {
          return;
        }

        if (ALL_TIMEZONES.includes(preference.timeZone)) {
          setTimeZoneState(preference.timeZone);
        }
      })
      .catch(() => {
        // Keep localStorage / browser value if the API is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setTimeZone(newZone: string) {
    if (!ALL_TIMEZONES.includes(newZone)) {
      return;
    }

    setTimeZoneState(newZone);

    void saveViewerTimezone(newZone).catch(() => {
      // Preference still applies locally even if persistence fails.
    });
  }

  return (
    <TimezoneContext.Provider value={{ timeZone, setTimeZone }}>
      {children}
    </TimezoneContext.Provider>
  );
}
