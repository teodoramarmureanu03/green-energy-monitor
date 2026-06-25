// ============================================================================
// CONTRACTUL PARTAJAT — sursa unică de adevăr pentru forma datelor.
// Frontend-ul scrie cod pe baza acestor tipuri; backend-ul (C#) le oglindește
// ca DTO-uri. Atât timp cât forma asta nu se schimbă, harta, panoul și backend-ul
// nu se blochează unul pe altul. NU modifica fără să anunți cealaltă persoană.
// ============================================================================

/** GET /api/countries  →  Country[] */
export interface Country {
  id: string;          // iso cu litere mici, ex. "ro"
  isoCode: string;     // "RO"
  name: string;        // "Romania"
  lat: number;
  lng: number;
  multiZone: boolean;  // true dacă ENTSO-E împarte țara (IT, NO, SE, DK...)
  zones: string[];     // sub-zonele pe care backend-ul le adună într-o singură țară
}

export type EnergySourceName =
  | "Nuclear"
  | "Fossil brown coal"
  | "Fossil hard coal"
  | "Fossil gas"
  | "Hydro Run-of-River"
  | "Hydro water reservoir"
  | "Wind onshore"
  | "Wind offshore"
  | "Solar"
  | "Biomass";

export interface SourceBreakdown {
  source: EnergySourceName;
  renewable: boolean;
  valueMw: number;
}

/** GET /api/generation/{isoCode}  →  CountryGeneration (instantaneul cel mai recent) */
export interface CountryGeneration {
  isoCode: string;
  country: string;
  timestamp: string;        // ISO 8601 UTC
  zonesAggregated: string[];
  total: number;            // MW, toate sursele adunate
  renewableMw: number;
  renewablePct: number;
  bySource: SourceBreakdown[];
}

/** Opțional: GET /api/generation/{isoCode}/timeseries?date=YYYY-MM-DD */
export interface TimeseriesPoint { timestamp: string; total: number; renewableMw: number; }
export interface CountryTimeseries {
  isoCode: string;
  date: string;
  points: TimeseriesPoint[];
}

// ----------------------------------------------------------------------------
// Grupare în categorii „mari" pentru afișare (Wind = onshore + offshore etc.)
// Folosit de panou și de graficul de mix ca să nu avem 10 felii minuscule.
// ----------------------------------------------------------------------------
export type DisplayCategory = "Wind" | "Solar" | "Hydro" | "Biomass" | "Nuclear" | "Fossil";

export function toDisplayCategory(source: EnergySourceName): DisplayCategory {
  if (source.startsWith("Wind")) return "Wind";
  if (source === "Solar") return "Solar";
  if (source.startsWith("Hydro")) return "Hydro";
  if (source === "Biomass") return "Biomass";
  if (source === "Nuclear") return "Nuclear";
  return "Fossil";
}