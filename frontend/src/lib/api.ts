import type {
  Country,
  CountryGeneration,
  GenerationHistoryApiPoint,
  HistoryPeriod,
} from "@/types/contract";
import countriesCatalog from "@/data/countries.json";
import {
  ACCESS_TOKEN_KEY,
  getAccessToken,
  refreshAccessToken,
} from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface ViewerTimezonePreference {
  clientId: string;
  countryIso: string;
  timeZone: string;
  updatedAt: string;
}

function authHeaders(json = false): HeadersInit {
  const headers: Record<string, string> = {};
  const token = getAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken()
      .then(() => true)
      .catch(() => {
        window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        return false;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

async function apiFetch(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<Response> {
  const headers = new Headers(init.headers);
  const auth = authHeaders(
    init.body != null && !headers.has("Content-Type")
  );

  Object.entries(auth).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status !== 401 || !retry || path.startsWith("/api/auth/")) {
    return response;
  }

  const refreshed = await tryRefreshSession();
  if (!refreshed) {
    return response;
  }

  return apiFetch(path, init, false);
}

export async function fetchCountries(): Promise<Country[]> {
  return countriesCatalog as Country[];
}

export async function fetchGeneration(
  isoCode: string
): Promise<CountryGeneration> {
  const response = await apiFetch(`/api/generation/${isoCode}`);

  if (response.status === 401) {
    throw new Error("Please sign in to view generation data.");
  }

  if (!response.ok) {
    throw new Error(`No generation data available for ${isoCode}.`);
  }

  return response.json();
}

export async function fetchGenerationHistory(
  isoCode: string,
  period: HistoryPeriod,
  timeZone?: string
): Promise<GenerationHistoryApiPoint[]> {
  const params = new URLSearchParams({ period });
  if (timeZone) {
    params.set("timeZone", timeZone);
  }

  const response = await apiFetch(
    `/api/history/${isoCode}?${params.toString()}`,
    { cache: "no-store" }
  );

  if (response.status === 401) {
    throw new Error("Please sign in to view history data.");
  }

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Could not load ${period} history for ${isoCode}.`);
  }

  return response.json();
}

export async function fetchViewerTimezone(
  clientId: string
): Promise<ViewerTimezonePreference | null> {
  const response = await apiFetch(
    `/api/preferences/timezone?clientId=${encodeURIComponent(clientId)}`
  );

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Could not load timezone preference.");
  }

  return response.json();
}

export async function saveViewerTimezone(
  clientId: string,
  countryIso: string,
  timeZone: string
): Promise<ViewerTimezonePreference> {
  const response = await apiFetch(`/api/preferences/timezone`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, countryIso, timeZone }),
  });

  if (response.status === 401) {
    throw new Error("Please sign in to save timezone preference.");
  }

  if (!response.ok) {
    throw new Error("Could not save timezone preference.");
  }

  return response.json();
}
