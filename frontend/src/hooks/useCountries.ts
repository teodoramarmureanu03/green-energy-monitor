import { useState, useEffect } from "react";
import { fetchCountries } from "@/lib/api";
import type { Country } from "@/types/contract";

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the country catalog from the API.
    fetchCountries()
      .then((data) => {
        setCountries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load countries:", err);
        setLoading(false);
      });
  }, []);

  return { countries, loading };
}
