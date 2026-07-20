import { describe, it, expect } from "vitest";
import {
  aggregateSources,
  formatMw,
  formatCompactMw,
  formatDateTime,
  getSourcePercentages,
  parseHistoryPoints,
} from "./dashboardUtils";
import type {
  SourceBreakdown,
  GenerationHistoryApiPoint,
} from "@/types/contract";

describe("dashboardUtils", () => {
  // 1. Test aggregation of energy sources (wind onshore/offshore & solar).
  describe("aggregateSources", () => {
    it("should aggregate wind and solar correctly and ignore other sources", () => {
      const mockSources: SourceBreakdown[] = [
        {
          source: "Wind onshore",
          valueMw: 150,
          renewable: false,
        },
        {
          source: "Wind offshore",
          valueMw: 50,
          renewable: false,
        },
        {
          source: "Solar",
          valueMw: 100,
          renewable: false,
        },
        {
          source: "Coal" as SourceBreakdown["source"],
          valueMw: 500,
          renewable: false,
        },
        {
          source: "Hydro" as SourceBreakdown["source"],
          valueMw: 300,
          renewable: false,
        },
      ];

      const result = aggregateSources(mockSources);
      expect(result.windMw).toBe(200); // 150 + 50
      expect(result.solarMw).toBe(100); // solar only
    });

    it("should return zeros for empty sources", () => {
      const result = aggregateSources([]);
      expect(result.windMw).toBe(0);
      expect(result.solarMw).toBe(0);
    });
  });

  // 2. Test standard megawatt (MW) formatting.
  describe("formatMw", () => {
    it("should return a dash for null or undefined values", () => {
      expect(formatMw(null)).toBe("—");
      expect(formatMw(undefined)).toBe("—");
    });

    it("should round values and format with thousand separators (en-GB style)", () => {
      expect(formatMw(1234.56)).toBe("1,235");
      expect(formatMw(99.4)).toBe("99");
    });
  });

  // 3. Test compact formatting (e.g. 1.5k instead of 1500).
  describe("formatCompactMw", () => {
    it("should return a dash for null or undefined", () => {
      expect(formatCompactMw(null)).toBe("—");
    });

    it("should return a rounded string for values under 1000", () => {
      expect(formatCompactMw(456.7)).toBe("457");
    });

    it("should return a compact 'k' format for values >= 1000", () => {
      expect(formatCompactMw(1200)).toBe("1.2k");
      expect(formatCompactMw(15550)).toBe("15.6k"); // rounded to one decimal place
    });
  });

  // 4. Test date and time formatting.
  describe("formatDateTime", () => {
    it("should format dates correctly into en-GB format", () => {
      const isoString = "2026-07-15T15:00:00Z";
      // Returns something like "15 Jul 2026, 15:00" depending on the local timezone.
      const result = formatDateTime(isoString);
      expect(result).toContain("2026");
      expect(result).toContain("Jul");
    });
  });

  // 5. Test wind vs solar percentage calculation.
  describe("getSourcePercentages", () => {
    it("should calculate correct percentages and make sure they sum to 100%", () => {
      const { windPct, solarPct } = getSourcePercentages(60, 40);
      expect(windPct).toBe(60);
      expect(solarPct).toBe(40);
    });

    it("should handle rounding properly", () => {
      // 10 of 30 is 33.33% (rounded to 33); solar gets the remainder to 100 (67).
      const { windPct, solarPct } = getSourcePercentages(10, 20);
      expect(windPct).toBe(33);
      expect(solarPct).toBe(67);
    });

    it("should return 0% for both if total is 0 or negative", () => {
      const { windPct, solarPct } = getSourcePercentages(0, 0);
      expect(windPct).toBe(0);
      expect(solarPct).toBe(0);
    });
  });

  // 6. Test history mapping and sorting for charts.
  describe("parseHistoryPoints", () => {
    it("should sort points by date ascending and map correct labels for 'week' period", () => {
      const apiPoints: GenerationHistoryApiPoint[] = [
        {
          date: "2026-07-16",
          total: 100,
          renewableMw: 50,
          windMw: 30,
          solarMw: 20,
          renewablePct: 0,
        },
        {
          date: "2026-07-15",
          total: 200,
          renewableMw: 100,
          windMw: 60,
          solarMw: 40,
          renewablePct: 0,
        }, // This one is earlier.
      ];

      const result = parseHistoryPoints(apiPoints, "week");

      // Check that sorting is correct (15 July should come first).
      expect(result[0].date).toBe("2026-07-15");
      expect(result[1].date).toBe("2026-07-16");

      // Check that a chart label was generated (e.g. "Wed, 15 Jul").
      expect(result[0].label).toContain("Jul");
    });
  });
});
