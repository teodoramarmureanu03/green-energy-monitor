import { useState, useEffect } from "react";
import { fetchGeneration } from "@/lib/api";
import type { CountryGeneration } from "@/types/contract";

const POLL_INTERVAL_MS = 60_000;

export function useAllGeneration(isoCodes: string[]) {
  const [map, setMap] = useState<Partial<Record<string, CountryGeneration>>>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Stop early when there are no countries to load.
    if (!isoCodes || isoCodes.length === 0) {
      setMap({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll(showLoading: boolean) {
      if (showLoading) setLoading(true);

      try {
        // 1. Build one request per country.
        const promises = isoCodes.map((iso) => fetchGeneration(iso));

        // 2. Send all requests to the server in parallel.
        const results = await Promise.allSettled(promises);

        if (cancelled) return;

        // 3. Build the map from successful responses only.
        const newMap: Partial<Record<string, CountryGeneration>> = {};

        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            newMap[isoCodes[index]] = result.value;
          }
        });

        setMap(newMap);
      } catch (err) {
        console.error("Failed to fetch generation data for all countries", err);
      } finally {
        if (!cancelled && showLoading) {
          setLoading(false);
        }
      }
    }

    // Initial load.
    void fetchAll(true);

    // Single shared timer that refreshes data every 60s.
    const intervalId = window.setInterval(() => {
      void fetchAll(false);
    }, POLL_INTERVAL_MS);

    // Cleanup when the component unmounts or the country list changes.
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isoCodes.join(",")]); // Rebuild requests only when the country list changes.

  return {
    map,
    loading,
  };
}
