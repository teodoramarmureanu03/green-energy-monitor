import { vi } from "vitest";
import * as api from "./lib/api";
import type { CountryGeneration } from "./types/contract";

// Mock the server response used by generation-related tests.
export function mockGeneration(data: Partial<CountryGeneration>) {
  vi.spyOn(api, "fetchGeneration").mockResolvedValue({
    isoCode: "DE",
    country: "Germany",
    sources: [],
    totalMw: 0,
    renewablePercent: 0,
    ...data,
  } as CountryGeneration);
}
