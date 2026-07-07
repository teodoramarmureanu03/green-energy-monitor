import { useState, useEffect } from "react";
import { fetchGeneration } from "@/lib/api";
import type { CountryGeneration } from "@/types/contract";

export function useGeneration(iso: string) {
  const [data, setData] = useState<CountryGeneration | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dacă nu avem un ISO valid, nu facem cererea
    if (!iso) return;

    // Resetăm starea la fiecare schimbare de țară
    setLoading(true);
    setError(null);

    fetchGeneration(iso)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Eroare la încărcarea datelor pentru ${iso}:`, err);
        setError("Nu am putut încărca datele pentru această țară.");
        setLoading(false);
      });
  }, [iso]); // Array-ul de dependențe [iso] face ca acest useEffect să ruleze din nou când se schimbă țara

  return { data, loading, error };
}