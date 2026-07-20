import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  HeroKpiCard,
  KpiCard,
  Card,
  DashboardSkeleton,
} from "./DashboardCards";

describe("DashboardCards Components", () => {
  // 1. Test HeroKpiCard.
  describe("HeroKpiCard", () => {
    it("renders all provided props correctly", () => {
      render(
        <HeroKpiCard
          label="Renewable Share"
          value="45"
          unit="%"
          sub="Average today"
          icon="🌱"
        />
      );

      expect(screen.getByText("Renewable Share")).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();
      expect(screen.getByText("%")).toBeInTheDocument();
      expect(screen.getByText("Average today")).toBeInTheDocument();
      expect(screen.getByText("🌱")).toBeInTheDocument();
    });
  });

  // 2. Test KpiCard and its custom inline styles.
  describe("KpiCard", () => {
    it("renders props and applies correct CSS variable styles", () => {
      const { container } = render(
        <KpiCard
          label="Wind Energy"
          value="1,200"
          unit="MW"
          sub="Onshore + Offshore"
          topColor="#22c55e"
          icon="💨"
          iconBg="rgba(34,197,94,0.1)"
        />
      );

      // Check content.
      expect(screen.getByText("Wind Energy")).toBeInTheDocument();
      expect(screen.getByText("1,200")).toBeInTheDocument();
      expect(screen.getByText("MW")).toBeInTheDocument();
      expect(screen.getByText("Onshore + Offshore")).toBeInTheDocument();
      expect(screen.getByText("💨")).toBeInTheDocument();

      // Check that dynamic CSS variables were applied on the wrapper.
      const cardElement = container.querySelector(".dashboard-kpi-card");
      expect(cardElement).toBeInTheDocument();

      const style = window.getComputedStyle(cardElement!);
      expect(style.getPropertyValue("--kpi-top-color")).toBe("#22c55e");
      expect(style.getPropertyValue("--kpi-icon-bg")).toBe(
        "rgba(34,197,94,0.1)"
      );
    });
  });

  // 3. Test Card (with a child component).
  describe("Card", () => {
    it("renders the title and children correctly", () => {
      render(
        <Card title="Power Sources Breakdown">
          <div data-testid="test-child">Child Content</div>
        </Card>
      );

      expect(screen.getByText("Power Sources Breakdown")).toBeInTheDocument();
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });
  });

  // 4. Test DashboardSkeleton.
  describe("DashboardSkeleton", () => {
    it("renders the correct number of skeleton loading blocks", () => {
      const { container } = render(<DashboardSkeleton />);

      // Check that the 4 KPI skeleton blocks render.
      const kpiSkeletons = container.querySelectorAll(
        ".dashboard-skeleton-kpi"
      );
      expect(kpiSkeletons.length).toBe(4);

      // Check that the 2 chart skeleton blocks render.
      const chartSkeletons = container.querySelectorAll(
        ".dashboard-skeleton-chart"
      );
      expect(chartSkeletons.length).toBe(2);
    });
  });
});
