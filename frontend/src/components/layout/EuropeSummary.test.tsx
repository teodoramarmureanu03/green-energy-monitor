import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import * as api from "@/lib/api";

import { EuropeSummary } from "./EuropeSummary";

describe("EuropeSummary Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calculates and displays aggregated European power metrics correctly", async () => {
    const mockCountries = [
      { isoCode: "RO", name: "Romania" },
      { isoCode: "DE", name: "Germany" },
    ];

    vi.spyOn(api, "fetchCountries").mockResolvedValue(mockCountries as any);

    vi.spyOn(api, "fetchGeneration").mockImplementation(async (iso) => {
      if (iso === "RO") {
        return { total: 1000, renewableMw: 400 } as any;
      }
      if (iso === "DE") {
        return { total: 3000, renewableMw: 1200 } as any;
      }
      return null as any;
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
