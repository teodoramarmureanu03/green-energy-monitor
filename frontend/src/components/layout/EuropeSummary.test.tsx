import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import * as api from "@/lib/api";
import type { Country, CountryGeneration } from "@/types/contract";

import { EuropeSummary } from "./EuropeSummary";

function mockCountry(partial: Pick<Country, "isoCode" | "name">): Country {
  return {
    id: partial.isoCode.toLowerCase(),
    isoCode: partial.isoCode,
    name: partial.name,
    lat: 0 as Country["lat"],
    lng: 0 as Country["lng"],
    multiZone: false,
    zones: [partial.isoCode],
  };
}

function mockGeneration(
  partial: Pick<CountryGeneration, "isoCode" | "total" | "renewableMw">
): CountryGeneration {
  return {
    isoCode: partial.isoCode,
    country: partial.isoCode,
    timestamp: "2026-07-22T00:00:00.000Z",
    zonesAggregated: [],
    total: partial.total,
    renewableMw: partial.renewableMw,
    renewablePct:
      partial.total > 0
        ? Math.round((partial.renewableMw / partial.total) * 1000) / 10
        : 0,
    bySource: [],
  };
}

describe("EuropeSummary Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calculates and displays aggregated European power metrics correctly", async () => {
    const mockCountries = [
      mockCountry({ isoCode: "RO", name: "Romania" }),
      mockCountry({ isoCode: "DE", name: "Germany" }),
    ];

    vi.spyOn(api, "fetchCountries").mockResolvedValue(mockCountries);

    vi.spyOn(api, "fetchGeneration").mockImplementation(async (iso) => {
      if (iso === "RO") {
        return mockGeneration({ isoCode: "RO", total: 1000, renewableMw: 400 });
      }

      if (iso === "DE") {
        return mockGeneration({
          isoCode: "DE",
          total: 3000,
          renewableMw: 1200,
        });
      }

      throw new Error(`Unexpected iso: ${iso}`);
    });

    render(<EuropeSummary />);

    expect(screen.getByText(/Loading European data/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("4,000")).toBeInTheDocument();
      expect(screen.getByText("40%")).toBeInTheDocument();
      expect(screen.getByText("1,600")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });
});
