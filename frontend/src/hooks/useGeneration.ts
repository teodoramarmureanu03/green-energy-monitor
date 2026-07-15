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

export function useAllGeneration(isos: string[]) {
  const [data, setData] = useState<CountryGeneration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dacă nu avem nicio țară în listă, ne oprim.
    if (!isos || isos.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll(showLoading: boolean) {
      if (showLoading) setLoading(true);

      try {
        // 1. Creăm un "batch" de cereri pentru toate țările
        const promises = isos.map(iso => fetchGeneration(iso));
        
        // 2. Le executăm pe TOATE simultan
        const results = await Promise.allSettled(promises);

        if (cancelled) return;

        // 3. Filtrăm doar cererile care au avut succes (dacă o țară pică, nu pică toată pagina)
        const successfulData = results
          .filter((res) => res.status === "fulfilled")
          .map((res: any) => res.value);

        setData(successfulData);
        setError(null);
      } catch {
        if (!cancelled) setError("Eroare la încărcarea datelor pentru țările selectate.");
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    // Prima încărcare
    void fetchAll(true);

    // 4. UN SINGUR timer de 60 de secunde pentru toate țările!
    const intervalId = window.setInterval(() => {
      void fetchAll(false);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isos.join(",")]); // Refacem timer-ul doar dacă se schimbă lista de țări

  return { data, loading, error };
}
