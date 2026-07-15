import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComparisonTable } from "./ComparisonTable";
import type { RankedCountryGeneration } from "./comparisonUtils";

// Simulăm funcția de formatare ca să nu depindem de fișierul extern de utilitare
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
    // maxMw este 8000 (Germania). România are 2000 => barWidth ar trebui să fie (2000 / 8000) * 100 = 25%
    const { container } = render(
      <ComparisonTable
        loading={false}
        ranked={mockData}
        maxMw={8000}
        onOpenCountry={vi.fn()}
      />
    );

    // Verificăm randarea textelor
    expect(screen.getByText("Romania")).toBeInTheDocument();
    expect(screen.getByText("Germany")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument(); // Wind RO
    expect(screen.getByText("3,000")).toBeInTheDocument(); // Solar DE

    // Verificăm lățimea bării de progres pentru România (primul rând de date)
    const progressFills = container.querySelectorAll(".comparison-progress-fill");
    expect(progressFills.length).toBe(2);
    
    // Verificăm stilul inline pentru primul rând (RO) -> width: 25%
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

    // Facem click pe rândul României
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

    // Focalizăm elementul și apăsăm Enter
    fireEvent.keyDown(row!, { key: "Enter" });
    expect(handleOpen).toHaveBeenCalledWith("DE");

    // Apăsăm Space
    fireEvent.keyDown(row!, { key: " " });
    expect(handleOpen).toHaveBeenCalledTimes(2); // S-a mai apelat o dată
  });
});