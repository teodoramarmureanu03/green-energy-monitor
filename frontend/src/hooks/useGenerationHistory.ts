import { useEffect, useState } from "react";

import { fetchGenerationHistory } from "@/lib/api";
import { useTimezone } from "@/hooks/useTimezone";

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
const POLL_INTERVAL_MS = 60_000;

async function loadHistoryForIso(
  isoCode: string,
  timeZone: string
): Promise<HistoryByPeriod> {
  const results = await Promise.all(
    PERIODS.map(async (period) => {
      const points = await fetchGenerationHistory(isoCode, period, timeZone);
      return [period, points] as const;
    })
  );

  const nextHistory = { ...EMPTY_HISTORY };
  for (const [period, points] of results) {
    nextHistory[period] = points;
  }

  return nextHistory;
}

export function useGenerationHistory(isoCode: string): GenerationHistoryState {
  const { timeZone } = useTimezone();
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

    async function loadHistory(showLoading: boolean) {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      try {
        const nextHistory = await loadHistoryForIso(isoCode, timeZone);

        if (cancelled) {
          return;
        }

        setHistoryByPeriod(nextHistory);

        const hasAnyData = PERIODS.some(
          (period) => nextHistory[period].length > 0
        );

        if (!hasAnyData && showLoading) {
          setError(
            "No historical data yet. The background sync may still be running."
          );
        } else if (hasAnyData) {
          setError(null);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(`History loading error for ${isoCode}:`, requestError);

        if (showLoading) {
          setHistoryByPeriod(EMPTY_HISTORY);
          setError("Could not load the historical production data.");
        }
      } finally {
        if (!cancelled && showLoading) {
          setLoading(false);
        }
      }
    }

    void loadHistory(true);

    const intervalId = window.setInterval(() => {
      void loadHistory(false);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isoCode, timeZone]);

  return {
    historyByPeriod,
    loading,
    error,
  };
}
