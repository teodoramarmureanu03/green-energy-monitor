import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

describe("Sidebar Component", () => {
  it("renders all navigation links when expanded", () => {
    // 1. We render the component wrapped in a Router
    render(
      <BrowserRouter>
        <Sidebar collapsed={false} onToggleCollapse={vi.fn()} />
      </BrowserRouter>
    );

    // 2. We verify that our main navigation labels are on the screen
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Europe Map")).toBeInTheDocument();
    expect(screen.getByText("Country Comparison")).toBeInTheDocument();
  });

  it("triggers the toggle function when the collapse button is clicked", () => {
    // 1. We create a "spy" function to check if the button works
    const mockToggle = vi.fn();

    render(
      <BrowserRouter>
        <Sidebar collapsed={false} onToggleCollapse={mockToggle} />
      </BrowserRouter>
    );

    // 2. We find the button by its title attribute
    const toggleButton = screen.getByTitle("Collapse sidebar");

    // 3. We simulate a user clicking it
    fireEvent.click(toggleButton);

    // 4. We verify the spy function was called exactly once
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
