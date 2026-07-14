import type {
  Country,
  CountryGeneration,
  GenerationHistoryApiPoint,
  HistoryPeriod,
} from "@/types/contract";
import countriesCatalog from "@/data/countries.json";

const API_BASE = "http://localhost:5243";

// Country names and map coordinates stay in a local catalog.
// Live generation numbers always come from the backend API.
export async function fetchCountries(): Promise<Country[]> {
  return countriesCatalog as Country[];
}

// Latest production snapshot for one country.
export async function fetchGeneration(
  isoCode: string
): Promise<CountryGeneration> {
  const response = await fetch(
    `${API_BASE}/api/generation/${isoCode}`
  );

  if (!response.ok) {
    throw new Error(
      `No generation data available for ${isoCode}.`
    );
  }

  return response.json();
}

// Historical chart data for week / month / year views.
export async function fetchGenerationHistory(
  isoCode: string,
  period: HistoryPeriod
): Promise<GenerationHistoryApiPoint[]> {
  const response = await fetch(
    `${API_BASE}/api/history/${isoCode}?period=${period}`,
    { cache: "no-store" }
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Could not load ${period} history for ${isoCode}.`
    );
  }

  return response.json();
}
