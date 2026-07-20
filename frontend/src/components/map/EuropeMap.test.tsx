import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EuropeMap } from "./EuropeMap";
import * as api from "@/lib/api";

// Mock the useCountries hook.
vi.mock("@/hooks/useCountries", () => ({
  useCountries: () => ({
    countries: [
      { isoCode: "RO", name: "Romania", lat: 46, lng: 25 },
      { isoCode: "DE", name: "Germany", lat: 51, lng: 9 },
    ],
  }),
}));

// Mock the map asset so tests do not load a huge GeoJSON file.
vi.mock("@/assets/europe.json", () => ({
  default: {
    type: "FeatureCollection",
    geographies: [],
  },
}));

describe("EuropeMap Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the accessible country navigation buttons", async () => {
    // Mock the API response for both countries.
    const spyFetch = vi.spyOn(api, "fetchGeneration");
    spyFetch.mockImplementation(async (iso) => {
      if (iso === "RO")
        return { isoCode: "RO", country: "Romania", renewablePct: 45 } as any;
      return { isoCode: "DE", country: "Germany", renewablePct: 30 } as any;
    });

    render(<EuropeMap onSelectCountry={vi.fn()} />);

    // Check that the accessible buttons rendered.
    await waitFor(() => {
      expect(screen.getByText(/Romania/i)).toBeInTheDocument();
      expect(screen.getByText(/Germany/i)).toBeInTheDocument();
    });
  });

  it("calls onSelectCountry when a country button is clicked", async () => {
    const handleSelect = vi.fn();
    vi.spyOn(api, "fetchGeneration").mockResolvedValue({
      renewablePct: 50,
    } as any);

    render(<EuropeMap onSelectCountry={handleSelect} />);

    // Find the accessible button for a country and click it.
    const button = await screen.findByRole("button", { name: /Romania/i });
    fireEvent.click(button);

    expect(handleSelect).toHaveBeenCalledWith("RO");
  });
});
