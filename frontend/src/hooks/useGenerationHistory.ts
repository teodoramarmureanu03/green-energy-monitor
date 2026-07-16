import { useEffect, useState } from "react";

import { fetchGenerationHistory } from "@/lib/api";

import type {
  GenerationHistoryApiPoint,
  HistoryPeriod,
} from "@/types/contract";

type HistoryByPeriod = Record<HistoryPeriod, GenerationHistoryApiPoint[]>;

interface GenerationHistoryState {
  historyByPeriod: HistoryByPeriod;
  loading: boolean;
  error: string | null;
}

const EMPTY_HISTORY: HistoryByPeriod = {
  week: [],
  month: [],
  year: [],
};

const PERIODS: HistoryPeriod[] = ["week", "month", "year"];

export function useGenerationHistory(isoCode: string): GenerationHistoryState {
  const [historyByPeriod, setHistoryByPeriod] =
    useState<HistoryByPeriod>(EMPTY_HISTORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isoCode) {
      setHistoryByPeriod(EMPTY_HISTORY);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);

      try {
        // Load each period separately so one missing range does not break the rest.
        const results = await Promise.all(
          PERIODS.map(async (period) => {
            const points = await fetchGenerationHistory(isoCode, period);
            return [period, points] as const;
          })
        );

        if (cancelled) {
          return;
        }

        const nextHistory = { ...EMPTY_HISTORY };
        for (const [period, points] of results) {
          nextHistory[period] = points;
        }

        setHistoryByPeriod(nextHistory);

        const hasAnyData = PERIODS.some(
          (period) => nextHistory[period].length > 0
        );

        if (!hasAnyData) {
          setError(
            "No historical data yet. The background sync may still be running."
          );
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(`History loading error for ${isoCode}:`, requestError);
        setHistoryByPeriod(EMPTY_HISTORY);
        setError("Could not load the historical production data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [isoCode]);

  return {
    historyByPeriod,
    loading,
    error,
  };
}
