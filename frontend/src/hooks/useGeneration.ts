import { useState, useEffect, useRef } from "react";
import { fetchGeneration } from "@/lib/api";
import type { CountryGeneration } from "@/types/contract";

const generationCache = new Map<string, CountryGeneration>();
const POLL_INTERVAL_MS = 60_000;

export function useGeneration(iso: string) {
  const [data, setData] = useState<CountryGeneration | null>(
    () => (iso ? generationCache.get(iso) ?? null : null)
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

        console.error(
          `Eroare la încărcarea datelor pentru ${iso}:`,
          err
        );

        // Keep stale data visible during background refresh failures.
        if (!generationCache.has(iso)) {
          setError(
            "Nu am putut încărca datele pentru această țară."
          );
        }
      } finally {
        if (
          !cancelled &&
          isoRef.current === iso &&
          showLoading
        ) {
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
