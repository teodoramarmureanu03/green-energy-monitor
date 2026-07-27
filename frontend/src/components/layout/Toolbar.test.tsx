import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Toolbar } from "./Toolbar";

const mockToggleTheme = vi.fn();
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: mockToggleTheme,
  }),
}));

const mockSetTimeZone = vi.fn();
vi.mock("@/hooks/useTimezone", () => ({
  useTimezone: () => ({
    timeZone: "Europe/Bucharest",
    setTimeZone: mockSetTimeZone,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    establishSession: vi.fn(),
    updateProfile: vi.fn(),
    logout: vi.fn(),
    deleteAccount: vi.fn(),
    clearError: vi.fn(),
  }),
}));

function renderToolbar(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Toolbar Component", () => {
  it("renders the title and subtitle correctly", () => {
    renderToolbar(
      <Toolbar title="Dashboard" subtitle="Overview of your system" />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Overview of your system")).toBeInTheDocument();
  });

  it("renders only the title if subtitle is not provided", () => {
    renderToolbar(<Toolbar title="Settings" />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    const subtitleElement = screen.queryByText("Overview of your system");
    expect(subtitleElement).not.toBeInTheDocument();
  });

  it("renders the timezone dropdown", () => {
    renderToolbar(<Toolbar title="Theme Test" />);

    expect(screen.getByText("Timezone")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Select timezone for dates and charts")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Europe/Bucharest")).toBeInTheDocument();
  });

  it("renders the account button next to the theme toggle", () => {
    renderToolbar(<Toolbar title="Theme Test" />);

    expect(screen.getByLabelText("Sign in or register")).toBeInTheDocument();
    expect(screen.getByTitle("Switch to dark mode")).toBeInTheDocument();
  });

  it("triggers the theme toggle function when clicked", () => {
    renderToolbar(<Toolbar title="Theme Test" />);

    const themeButton = screen.getByTitle("Switch to dark mode");
    expect(themeButton).toBeInTheDocument();

    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});
