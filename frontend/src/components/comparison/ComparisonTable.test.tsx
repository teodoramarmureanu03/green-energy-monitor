import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComparisonTable } from "./ComparisonTable";
import type { RankedCountryGeneration } from "./comparisonUtils";
import type { Country, CountryGeneration } from "@/types/contract";

vi.mock("./comparisonUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./comparisonUtils")>();

  return {
    ...actual,
    formatMw: (val: number) => `${Math.round(val).toLocaleString("en-GB")}`,
  };
});

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

function mockGeneration(isoCode: string, name: string): CountryGeneration {
  return {
    isoCode,
    country: name,
    timestamp: "2026-07-22T00:00:00.000Z",
    zonesAggregated: [],
    total: 0,
    renewableMw: 0,
    renewablePct: 0,
    bySource: [],
  };
}

const mockData: RankedCountryGeneration[] = [
  {
    country: mockCountry({ isoCode: "RO", name: "Romania" }),
    generation: mockGeneration("RO", "Romania"),
    windMw: 1500,
    solarMw: 500,
    totalRenewable: 2000,
  },
  {
    country: mockCountry({ isoCode: "DE", name: "Germany" }),
    generation: mockGeneration("DE", "Germany"),
    windMw: 5000,
    solarMw: 3000,
    totalRenewable: 8000,
  },
];

describe("ComparisonTable Component", () => {
  it("renders loading state correctly", () => {
    render(
      <ComparisonTable
        loading={true}
        ranked={[]}
        maxMw={0}
        onOpenCountry={vi.fn()}
      />
    );

    expect(screen.getByText("Loading country data…")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the table rows and calculates progress bar width correctly", () => {
    const { container } = render(
      <ComparisonTable
        loading={false}
        ranked={mockData}
        maxMw={8000}
        onOpenCountry={vi.fn()}
      />
    );

    expect(screen.getByText("Romania")).toBeInTheDocument();
    expect(screen.getByText("Germany")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("3,000")).toBeInTheDocument();

    const progressFills = container.querySelectorAll(
      ".comparison-progress-fill"
    );
    expect(progressFills.length).toBe(2);
    expect((progressFills[0] as HTMLElement).style.width).toBe("25%");
  });

  it("triggers onOpenCountry when a row is clicked", () => {
    const handleOpen = vi.fn();
    render(
      <ComparisonTable
        loading={false}
        ranked={mockData}
        maxMw={8000}
        onOpenCountry={handleOpen}
      />
    );

    const row = screen.getByText("Romania").closest("tr");
    expect(row).toBeInTheDocument();

    fireEvent.click(row!);
    expect(handleOpen).toHaveBeenCalledWith("RO");
  });

  it("supports keyboard navigation (accessibility with Enter and Space)", () => {
    const handleOpen = vi.fn();
    render(
      <ComparisonTable
        loading={false}
        ranked={mockData}
        maxMw={8000}
        onOpenCountry={handleOpen}
      />
    );

    const row = screen.getByText("Germany").closest("tr");
    expect(row).toBeInTheDocument();

    fireEvent.keyDown(row!, { key: "Enter" });
    expect(handleOpen).toHaveBeenCalledWith("DE");

    fireEvent.keyDown(row!, { key: " " });
    expect(handleOpen).toHaveBeenCalledTimes(2);
  });
});
