import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComparisonTable } from "./ComparisonTable";
import type { RankedCountryGeneration } from "./comparisonUtils";

// Mock the formatting helper so the test does not depend on the external util file.
vi.mock("./comparisonUtils", () => ({
  formatMw: (val: number) => `${Math.round(val).toLocaleString("en-GB")}`,
}));

const mockData: RankedCountryGeneration[] = [
  {
    country: { isoCode: "RO", name: "Romania" },
    windMw: 1500,
    solarMw: 500,
    totalRenewable: 2000,
  } as any,
  {
    country: { isoCode: "DE", name: "Germany" },
    windMw: 5000,
    solarMw: 3000,
    totalRenewable: 8000,
  } as any,
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
    // maxMw is 8000 (Germany). Romania has 2000 => barWidth should be (2000 / 8000) * 100 = 25%.
    const { container } = render(
      <ComparisonTable
        loading={false}
        ranked={mockData}
        maxMw={8000}
        onOpenCountry={vi.fn()}
      />
    );

    // Check rendered text.
    expect(screen.getByText("Romania")).toBeInTheDocument();
    expect(screen.getByText("Germany")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument(); // Wind RO
    expect(screen.getByText("3,000")).toBeInTheDocument(); // Solar DE

    // Check the progress bar width for Romania (first data row).
    const progressFills = container.querySelectorAll(
      ".comparison-progress-fill"
    );
    expect(progressFills.length).toBe(2);

    // Check the inline style for the first row (RO) -> width: 25%.
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

    // Click the Romania row.
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

    // Focus the element and press Enter.
    fireEvent.keyDown(row!, { key: "Enter" });
    expect(handleOpen).toHaveBeenCalledWith("DE");

    // Press Space.
    fireEvent.keyDown(row!, { key: " " });
    expect(handleOpen).toHaveBeenCalledTimes(2); // Called once more.
  });
});
