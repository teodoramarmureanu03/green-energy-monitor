import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CapacityBarChart } from "./CapacityBarChart";

// Facem un mock pentru ResponsiveContainer ca sa evitam erorile de dimensiuni 0x0 din JSDOM
vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 260 }}>{children}</div>
    ),
  };
});

describe("Componenta CapacityBarChart", () => {
  const mockData = [
    { name: "Wind", mw: 4500 },
    { name: "Solar", mw: 2300 },
  ];

  it("randează titlul cardului și legenda", () => {
    render(<CapacityBarChart data={mockData} />);

    // Verificăm dacă titlul cardului apare
    expect(screen.getByText("Capacity by source (MW)")).toBeInTheDocument();

    // Verificăm dacă legenda e inclusă
    expect(screen.getByText("Wind")).toBeInTheDocument();
    expect(screen.getByText("Solar")).toBeInTheDocument();
  });

  it("randează fără erori chiar și când lista de date este goală", () => {
    render(<CapacityBarChart data={[]} />);

    expect(screen.getByText("Capacity by source (MW)")).toBeInTheDocument();
  });
});
