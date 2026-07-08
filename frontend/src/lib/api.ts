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
const API_BASE = "http://localhost:5243";
//import countriesData from "@/data/countries.json";
//import generationData from "@/data/generation-latest.json";



/** Lista tuturor țărilor (pentru hartă și pentru selector). */
export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(`${API_BASE}/api/countries`);
  if (!res.ok) throw new Error("Nu am putut încărca țările");
  return res.json();
}

/** Datele de producție pentru o țară, după codul ISO (ex. "DE"). */
export async function fetchGeneration(isoCode: string): Promise<CountryGeneration> {
  const res = await fetch(`${API_BASE}/api/generation/${isoCode}`);
  if (!res.ok) throw new Error(`Nu există date pentru ${isoCode}`);
  return res.json();
}