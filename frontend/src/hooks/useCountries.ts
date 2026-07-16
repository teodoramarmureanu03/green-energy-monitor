import { useState, useEffect } from "react";
import { fetchCountries } from "@/lib/api"; // Asigură-te că aduci funcția din api.ts
import type { Country } from "@/types/contract";

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apelăm backend-ul
    fetchCountries()
      .then((data) => {
        setCountries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Eroare la încărcarea țărilor:", err);
        setLoading(false);
      });
  }, []);

  return { countries, loading };
}
