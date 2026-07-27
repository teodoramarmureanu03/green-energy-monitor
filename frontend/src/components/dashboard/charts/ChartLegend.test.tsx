import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
// (Dacă ai erori la importul de mai sus, înlocuiește-l cu: import { render, screen } from '../../test-utils';)

import { ChartLegend } from "./ChartLegend";

describe("Componenta ChartLegend", () => {
  it("randează corect etichetele pentru Wind și Solar", () => {
    // 1. Desenăm componenta în ecranul nostru virtual de teste
    render(<ChartLegend />);

    // 2. Căutăm textele pe ecran
    const windLabel = screen.getByText("Wind");
    const solarLabel = screen.getByText("Solar");

    // 3. Ne asigurăm că ambele etichete există în document
    expect(windLabel).toBeInTheDocument();
    expect(solarLabel).toBeInTheDocument();
  });
});
