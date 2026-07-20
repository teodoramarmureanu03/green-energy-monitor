import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";

// Mock useTheme so we can control its state in tests.
const mockToggleTheme = vi.fn();
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: mockToggleTheme,
  }),
}));

describe("Toolbar Component", () => {
  it("renders the title and subtitle correctly", () => {
    render(<Toolbar title="Dashboard" subtitle="Overview of your system" />);

    // Check that the title and subtitle are shown.
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Overview of your system")).toBeInTheDocument();
  });

  it("renders only the title if subtitle is not provided", () => {
    render(<Toolbar title="Settings" />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    // The subtitle should not be on the screen.
    const subtitleElement = screen.queryByText("Overview of your system");
    expect(subtitleElement).not.toBeInTheDocument();
  });

  it("triggers the theme toggle function when clicked", () => {
    render(<Toolbar title="Theme Test" />);

    // Find the button by its aria-label/title (light theme asks for dark mode).
    const themeButton = screen.getByTitle("Switch to dark mode");
    expect(themeButton).toBeInTheDocument();

    // Simulate a user click.
    fireEvent.click(themeButton);

    // Check that toggleTheme from the hook was called.
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});
