import { useEffect, useState, type ReactNode } from "react";

import {
  fetchViewerTimezone,
  saveViewerTimezone,
} from "@/lib/api";
import {
  DEFAULT_TIMEZONE_ISO,
  getTimezoneOption,
  TIMEZONE_OPTIONS,
} from "@/lib/timezones";
import { TimezoneContext } from "@/lib/timezone-context";

const STORAGE_KEY = "eu-renewables-timezone-iso";
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

function getInitialIso(): string {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (
    stored &&
    TIMEZONE_OPTIONS.some((option) => option.isoCode === stored.toUpperCase())
  ) {
    return stored.toUpperCase();
  }

  return DEFAULT_TIMEZONE_ISO;
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [countryIso, setCountryIsoState] = useState(getInitialIso);
  const clientId = getOrCreateClientId();
  const option = getTimezoneOption(countryIso);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, countryIso);
  }, [countryIso]);

  useEffect(() => {
    let cancelled = false;

    fetchViewerTimezone(clientId)
      .then((preference) => {
        if (cancelled || !preference?.countryIso) {
          return;
        }

        const next = preference.countryIso.toUpperCase();
        if (TIMEZONE_OPTIONS.some((item) => item.isoCode === next)) {
          setCountryIsoState(next);
        }
      })
      .catch(() => {
        // Keep localStorage value if the API is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  function setCountryIso(isoCode: string) {
    const next = isoCode.toUpperCase();
    const selected = getTimezoneOption(next);
    setCountryIsoState(selected.isoCode);

    void saveViewerTimezone(clientId, selected.isoCode, selected.timeZone).catch(
      () => {
        // Preference still applies locally even if persistence fails.
      }
    );
  }

  return (
    <TimezoneContext.Provider
      value={{
        countryIso: option.isoCode,
        timeZone: option.timeZone,
        option,
        setCountryIso,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}
