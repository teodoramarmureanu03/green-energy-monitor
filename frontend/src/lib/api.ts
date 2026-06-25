// ============================================================================
// STRATUL DE DATE — singurul loc care „știe" de unde vin datele.
//
// ACUM: citește din fișierele mock din src/data (instant, fără server).
// MAI TÂRZIU: schimbi DOAR funcțiile de aici ca să facă fetch la backend-ul
// vostru .NET. Restul aplicației (hook, componente) NU se schimbă deloc,
// pentru că forma returnată (Country / CountryGeneration) rămâne identică.
//
// Ca să treci pe backend real, înlocuiește corpul celor două funcții cu:
//   const res = await fetch(`${API_BASE}/api/countries`);
//   return res.json();
// și gata.
// ============================================================================

import type { Country, CountryGeneration } from "@/types/contract";
import countriesData from "@/data/countries.json";
import generationData from "@/data/generation-latest.json";

// Când treceți pe backend real, puneți aici adresa lui (ex. "http://localhost:5000")
// și decomentați liniile cu fetch din funcțiile de mai jos.
// export const API_BASE = "http://localhost:5000";

// mică întârziere artificială ca să vedem stările de „loading" în UI
const fakeDelay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Lista tuturor țărilor (pentru hartă și pentru selector). */
export async function fetchCountries(): Promise<Country[]> {
  await fakeDelay();
  return countriesData as Country[];
  // BACKEND REAL:
  // const res = await fetch(`${API_BASE}/api/countries`);
  // if (!res.ok) throw new Error("Nu am putut încărca lista de țări");
  // return res.json();
}

/** Datele de producție pentru o țară, după codul ISO (ex. "DE"). */
export async function fetchGeneration(isoCode: string): Promise<CountryGeneration> {
  await fakeDelay();
  const all = generationData as Record<string, CountryGeneration>;
  const data = all[isoCode.toUpperCase()];
  if (!data) {
    throw new Error(`Nu există date pentru țara "${isoCode}"`);
  }
  return data;
  // BACKEND REAL:
  // const res = await fetch(`${API_BASE}/api/generation/${isoCode}`);
  // if (res.status === 404) throw new Error(`Nu există date pentru "${isoCode}"`);
  // if (!res.ok) throw new Error("Eroare la încărcarea datelor");
  // return res.json();
}