import type {
  Country,
  CountryGeneration,
  GenerationHistoryApiPoint,
  HistoryPeriod,
} from "@/types/contract";
import countriesCatalog from "@/data/countries.json";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface ViewerTimezonePreference {
  clientId: string;
  countryIso: string;
  timeZone: string;
  updatedAt: string;
}

// Country names and map coordinates stay in a local catalog.
// Live generation numbers always come from the backend API.
export async function fetchCountries(): Promise<Country[]> {
  return countriesCatalog as Country[];
}

// Latest production snapshot for one country.
export async function fetchGeneration(
  isoCode: string
): Promise<CountryGeneration> {
  const response = await fetch(`${API_BASE}/api/generation/${isoCode}`);

  if (!response.ok) {
    throw new Error(`No generation data available for ${isoCode}.`);
  }

  return response.json();
}

// Historical chart data for week / month / year views.
export async function fetchGenerationHistory(
  isoCode: string,
  period: HistoryPeriod,
  timeZone?: string
): Promise<GenerationHistoryApiPoint[]> {
  const params = new URLSearchParams({ period });
  if (timeZone) {
    params.set("timeZone", timeZone);
  }

  const response = await fetch(
    `${API_BASE}/api/history/${isoCode}?${params.toString()}`,
    { cache: "no-store" }
  );

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
  const response = await fetch(
    `${API_BASE}/api/preferences/timezone?clientId=${encodeURIComponent(clientId)}`
  );

  if (response.status === 404) {
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
  const response = await fetch(`${API_BASE}/api/preferences/timezone`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, countryIso, timeZone }),
  });

  if (!response.ok) {
    throw new Error("Could not save timezone preference.");
  }

  return response.json();
}
