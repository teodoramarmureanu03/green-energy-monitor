import { useEffect, useState, type ReactNode } from "react";

import { fetchViewerTimezone, saveViewerTimezone } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ALL_TIMEZONES, getUserLocalTimezone } from "@/lib/timezones";
import { TimezoneContext } from "@/lib/timezone-context";

const STORAGE_KEY = "eu-renewables-timezone-iana";
const CLIENT_ID_KEY = "eu-renewables-client-id";

function getOrCreateClientId(): string {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}

function getStoredTimezone(): string {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && ALL_TIMEZONES.includes(stored)) {
    return stored;
  }

  return getUserLocalTimezone();
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const isAuthenticated = Boolean(user);
  const [timeZone, setTimeZoneState] = useState(getUserLocalTimezone);
  const [clientId] = useState(getOrCreateClientId);

  // Guests always follow the browser; signed-in users keep their preference.
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setTimeZoneState(getUserLocalTimezone());
      return;
    }

    setTimeZoneState(getStoredTimezone());
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, timeZone);
  }, [timeZone, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    fetchViewerTimezone(clientId)
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
  }, [clientId, isAuthenticated]);

  function setTimeZone(newZone: string) {
    if (!isAuthenticated || !ALL_TIMEZONES.includes(newZone)) {
      return;
    }

    setTimeZoneState(newZone);

    void saveViewerTimezone(clientId, "", newZone).catch(() => {
      // Preference still applies locally even if persistence fails.
    });
  }

  return (
    <TimezoneContext.Provider value={{ timeZone, setTimeZone }}>
      {children}
    </TimezoneContext.Provider>
  );
}
