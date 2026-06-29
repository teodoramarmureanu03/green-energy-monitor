// ============================================================================
// HOOK: useGeneration(isoCode)
// Primește un cod ISO (ex. "DE") și întoarce { data, loading, error }.
// Reîncarcă automat când se schimbă țara selectată.
// Folosit de panou, dashboard și tooltip-ul hărții.
// ============================================================================

import { useEffect, useState } from "react";
import type { CountryGeneration } from "@/types/contract";
import { fetchGeneration } from "@/lib/api";

interface UseGenerationResult {
  data: CountryGeneration | null;
  loading: boolean;
  error: string | null;
}

export function useGeneration(isoCode: string | null): UseGenerationResult {
  const [data, setData] = useState<CountryGeneration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // dacă nu e selectată nicio țară, golim totul
    // dacă nu e selectată nicio țară, nu facem nimic
    if (!isoCode) return;

    let cancelled = false; // ca să nu setăm starea după ce s-a schimbat țara
    setLoading(true);
    setError(null);

    fetchGeneration(isoCode)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isoCode]);

  return { data, loading, error };
}