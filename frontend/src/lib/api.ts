import type {
  Country,
  CountryGeneration,
  GenerationHistoryApiPoint,
  HistoryPeriod,
} from "@/types/contract";

const API_BASE = "http://localhost:5243";

export async function fetchCountries(): Promise<Country[]> {
  const response = await fetch(`${API_BASE}/api/countries`);

  if (!response.ok) {
    throw new Error("Could not load countries.");
  }

  return response.json();
}

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

export async function fetchGenerationHistory(
  isoCode: string,
  period: HistoryPeriod
): Promise<GenerationHistoryApiPoint[]> {
  const response = await fetch(
    `${API_BASE}/api/generation/history/${isoCode}?period=${period}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `No ${period} history available for ${isoCode}.`
    );
  }

  return response.json();
}
