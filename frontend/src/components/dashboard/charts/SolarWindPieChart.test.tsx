import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SolarWindPieChart } from "./SolarWindPieChart";

// Mock pentru ResponsiveContainer
vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  };
});

describe("Componenta SolarWindPieChart", () => {
  const mockData = [
    { name: "Wind", value: 3500 },
    { name: "Solar", value: 1500 },
  ];

  it('randează titlul cardului "Solar vs wind mix" și legenda', () => {
    render(<SolarWindPieChart data={mockData} />);

    // Verificăm titlul
    expect(screen.getByText("Solar vs wind mix")).toBeInTheDocument();

    // Verificăm dacă legenda este randată
    expect(screen.getByText("Wind")).toBeInTheDocument();
    expect(screen.getByText("Solar")).toBeInTheDocument();
  });

  it("se randează fără erori chiar și când primește o listă goală de date", () => {
    render(<SolarWindPieChart data={[]} />);

    expect(screen.getByText("Solar vs wind mix")).toBeInTheDocument();
  });
});
