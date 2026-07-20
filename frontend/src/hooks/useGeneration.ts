import { useState, useEffect, useRef } from "react";
import { fetchGeneration } from "@/lib/api";
import type { CountryGeneration } from "@/types/contract";

const generationCache = new Map<string, CountryGeneration>();
const POLL_INTERVAL_MS = 60_000;

export function useGeneration(iso: string) {
  const [data, setData] = useState<CountryGeneration | null>(() =>
    iso ? (generationCache.get(iso) ?? null) : null
  );
  const [loading, setLoading] = useState<boolean>(
    () => !iso || !generationCache.has(iso)
  );
  const [error, setError] = useState<string | null>(null);
  const isoRef = useRef(iso);

  useEffect(() => {
    if (!iso) return;

    isoRef.current = iso;
    let cancelled = false;

    const cached = generationCache.get(iso);

    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
    } else {
      setData(null);
      setLoading(true);
      setError(null);
    }

    async function refresh(showLoading: boolean) {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await fetchGeneration(iso);

        if (cancelled || isoRef.current !== iso) {
          return;
        }

        generationCache.set(iso, result);
        setData(result);
        setError(null);
      } catch (err) {
        if (cancelled || isoRef.current !== iso) {
          return;
        }

        console.error(`Failed to load generation data for ${iso}:`, err);

        // Keep stale data visible during background refresh failures.
        if (!generationCache.has(iso)) {
          setError("Could not load data for this country.");
        }
      } finally {
        if (!cancelled && isoRef.current === iso && showLoading) {
          setLoading(false);
        }
      }
    }

    void refresh(!cached);

    const intervalId = window.setInterval(() => {
      void refresh(false);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [iso]);

  return { data, loading, error };
}

export function useAllGeneration(isos: string[]) {
  const [data, setData] = useState<CountryGeneration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Stop early when there are no countries to load.
    if (!isos || isos.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll(showLoading: boolean) {
      if (showLoading) setLoading(true);

      try {
        // 1. Build one request per country.
        const promises = isos.map((iso) => fetchGeneration(iso));

        // 2. Run all requests in parallel.
        const results = await Promise.allSettled(promises);

        if (cancelled) return;

        // 3. Keep only successful responses so one failure does not blank the page.
        const successfulData = results
          .filter((res) => res.status === "fulfilled")
          .map((res: any) => res.value);

        setData(successfulData);
        setError(null);
      } catch {
        if (!cancelled)
          setError("Failed to load data for the selected countries.");
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    // Initial load.
    void fetchAll(true);

    // Single shared 60s refresh timer for all countries.
    const intervalId = window.setInterval(() => {
      void fetchAll(false);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isos.join(",")]); // Rebuild the timer only when the country list changes.

  return { data, loading, error };
}
