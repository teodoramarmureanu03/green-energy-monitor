import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

vi.mock("@/hooks/useTimezone", () => ({
  useTimezone: () => ({
    timeZone: "Europe/Bucharest",
    setTimeZone: vi.fn(),
  }),
}));

describe("Sidebar Component", () => {
  it("renders all navigation links when expanded", () => {
    render(
      <BrowserRouter>
        <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Europe Map")).toBeInTheDocument();
    expect(screen.getByText("Country Comparison")).toBeInTheDocument();
  });

  it("triggers the toggle function when the collapse button is clicked", () => {
    const mockToggle = vi.fn();

    render(
      <BrowserRouter>
        <Sidebar collapsed={false} onToggleCollapse={mockToggle} />
      </BrowserRouter>
    );

    const toggleButton = screen.getByTitle("Collapse sidebar");

    fireEvent.click(toggleButton);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
