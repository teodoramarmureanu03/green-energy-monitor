import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EuropeMap } from "./EuropeMap";
import * as api from "@/lib/api";
import type { CountryGeneration } from "@/types/contract";

vi.mock("@/hooks/useCountries", () => ({
  useCountries: () => ({
    countries: [
      { isoCode: "RO", name: "Romania", lat: 46, lng: 25 },
      { isoCode: "DE", name: "Germany", lat: 51, lng: 9 },
    ],
  }),
}));

vi.mock("@/assets/europe.json", () => ({
  default: {
    type: "FeatureCollection",
    geographies: [],
  },
}));

function mockGeneration(
  partial: Pick<CountryGeneration, "isoCode" | "country" | "renewablePct">
): CountryGeneration {
  return {
    isoCode: partial.isoCode,
    country: partial.country,
    timestamp: "2026-07-22T00:00:00.000Z",
    zonesAggregated: [],
    total: 1000,
    renewableMw: 400,
    renewablePct: partial.renewablePct,
    bySource: [],
  };
}

describe("EuropeMap Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the accessible country navigation buttons", async () => {
    const spyFetch = vi.spyOn(api, "fetchGeneration");
    spyFetch.mockImplementation(async (iso) => {
      if (iso === "RO") {
        return mockGeneration({
          isoCode: "RO",
          country: "Romania",
          renewablePct: 45,
        });
      }

      return mockGeneration({
        isoCode: "DE",
        country: "Germany",
        renewablePct: 30,
      });
    });

    render(<EuropeMap onSelectCountry={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Romania/i)).toBeInTheDocument();
      expect(screen.getByText(/Germany/i)).toBeInTheDocument();
    });
  });

  it("calls onSelectCountry when a country button is clicked", async () => {
    const handleSelect = vi.fn();
    vi.spyOn(api, "fetchGeneration").mockResolvedValue(
      mockGeneration({
        isoCode: "RO",
        country: "Romania",
        renewablePct: 50,
      })
    );

    render(<EuropeMap onSelectCountry={handleSelect} />);

    const button = await screen.findByRole("button", { name: /Romania/i });
    fireEvent.click(button);

    expect(handleSelect).toHaveBeenCalledWith("RO");
  });
});
