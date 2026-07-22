import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";

const mockToggleTheme = vi.fn();
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: mockToggleTheme,
  }),
}));

const mockSetCountryIso = vi.fn();
vi.mock("@/hooks/useTimezone", () => ({
  useTimezone: () => ({
    countryIso: "RO",
    timeZone: "Europe/Bucharest",
    option: {
      isoCode: "RO",
      name: "Romania",
      timeZone: "Europe/Bucharest",
    },
    setCountryIso: mockSetCountryIso,
  }),
}));

describe("Toolbar Component", () => {
  it("renders the title and subtitle correctly", () => {
    render(<Toolbar title="Dashboard" subtitle="Overview of your system" />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Overview of your system")).toBeInTheDocument();
  });

  it("renders only the title if subtitle is not provided", () => {
    render(<Toolbar title="Settings" />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    const subtitleElement = screen.queryByText("Overview of your system");
    expect(subtitleElement).not.toBeInTheDocument();
  });

  it("renders the timezone country dropdown", () => {
    render(<Toolbar title="Theme Test" />);

    expect(screen.getByText("Timezone")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Select country timezone for dates and charts")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Romania")).toBeInTheDocument();
  });

  it("triggers the theme toggle function when clicked", () => {
    render(<Toolbar title="Theme Test" />);

    const themeButton = screen.getByTitle("Switch to dark mode");
    expect(themeButton).toBeInTheDocument();

    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});
