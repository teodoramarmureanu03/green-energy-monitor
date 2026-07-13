import { useEffect, useState } from "react";

import { fetchGenerationHistory } from "@/lib/api";

import type {
  GenerationHistoryApiPoint,
  HistoryPeriod,
} from "@/types/contract";

type HistoryByPeriod = Record<
  HistoryPeriod,
  GenerationHistoryApiPoint[]
>;

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

const historyCache = new Map<string, HistoryByPeriod>();

const POLL_INTERVAL_MS = 60_000;

async function loadHistoryForIso(
  isoCode: string
): Promise<HistoryByPeriod> {
  const [week, month, year] = await Promise.all([
    fetchGenerationHistory(isoCode, "week"),
    fetchGenerationHistory(isoCode, "month"),
    fetchGenerationHistory(isoCode, "year"),
  ]);

  return {
    week,
    month,
    year,
  };
}

function hasAnyHistory(
  history: HistoryByPeriod
): boolean {
  return (
    history.week.length > 0 ||
    history.month.length > 0 ||
    history.year.length > 0
  );
}

export function useGenerationHistory(
  isoCode: string
): GenerationHistoryState {
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

    const cachedHistory = historyCache.get(isoCode);

    if (cachedHistory) {
      setHistoryByPeriod(cachedHistory);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    async function refresh(showLoading: boolean) {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      try {
        const loadedHistory =
          await loadHistoryForIso(isoCode);

        if (cancelled) {
          return;
        }

        historyCache.set(isoCode, loadedHistory);
        setHistoryByPeriod(loadedHistory);
        setError(null);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          `History loading error for ${isoCode}:`,
          requestError
        );

        // Keep showing stale data when a background refresh fails.
        const currentHistory =
          historyCache.get(isoCode) ?? EMPTY_HISTORY;

        if (!hasAnyHistory(currentHistory)) {
          setHistoryByPeriod(EMPTY_HISTORY);
          setError(
            "Could not load the historical production data."
          );
        }
      } finally {
        if (!cancelled && showLoading) {
          setLoading(false);
        }
      }
    }

    void refresh(!cachedHistory);

    const intervalId = window.setInterval(() => {
      void refresh(false);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isoCode]);

  return {
    historyByPeriod,
    loading,
    error,
  };
}
