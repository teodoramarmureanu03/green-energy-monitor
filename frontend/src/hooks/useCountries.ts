// HOOK: useCountries() — încarcă lista de țări o dată, la pornire.
import { useEffect, useState } from "react";
import type { Country } from "@/types/contract";
import { fetchCountries } from "@/lib/api";

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCountries()
      .then((data) => {
        if (!cancelled) setCountries(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { countries, loading };
}