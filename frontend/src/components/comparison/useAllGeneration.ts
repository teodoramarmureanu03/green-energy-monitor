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
    // Dacă nu avem nicio țară, oprim execuția
    if (!isoCodes || isoCodes.length === 0) {
      setMap({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll(showLoading: boolean) {
      if (showLoading) setLoading(true);

      try {
        // 1. Creăm lista de cereri pentru toate țările
        const promises = isoCodes.map((iso) => fetchGeneration(iso));

        // 2. Le trimitem pe toate simultan către server
        const results = await Promise.allSettled(promises);

        if (cancelled) return;

        // 3. Construim map-ul doar cu datele care au venit cu succes
        const newMap: Partial<Record<string, CountryGeneration>> = {};

        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            newMap[isoCodes[index]] = result.value;
          }
        });

        setMap(newMap);
      } catch (err) {
        console.error("Eroare la aducerea datelor pentru toate țările", err);
      } finally {
        if (!cancelled && showLoading) {
          setLoading(false);
        }
      }
    }

    // Facem prima cerere
    void fetchAll(true);

    // 4. Setăm UN SINGUR timer pentru a reîmprospăta datele la fiecare 60s
    const intervalId = window.setInterval(() => {
      void fetchAll(false);
    }, POLL_INTERVAL_MS);

    // Funcția de curățare la demontarea componentei
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isoCodes.join(",")]); // Refacem cererea doar dacă se schimbă lista de țări

  return {
    map,
    loading,
  };
}
