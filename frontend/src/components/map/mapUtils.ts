import type { Feature, Geometry } from "geojson";

export const ISO3_TO_ISO2: Record<string, string> = {
  AUT: "AT",
  BEL: "BE",
  BGR: "BG",
  CHE: "CH",
  CZE: "CZ",
  DEU: "DE",
  DNK: "DK",
  EST: "EE",
  ESP: "ES",
  FIN: "FI",
  FRA: "FR",
  GRC: "GR",
  HRV: "HR",
  HUN: "HU",
  IRL: "IE",
  ITA: "IT",
  LTU: "LT",
  LVA: "LV",
  NLD: "NL",
  NOR: "NO",
  POL: "PL",
  PRT: "PT",
  ROU: "RO",
  SWE: "SE",
  SVN: "SI",
  SVK: "SK",
};

export interface GeoProperties {
  iso_a3?: string;
  name?: string;
}

export type GeoFeature = Feature<Geometry, GeoProperties> & { rsmKey: string };

export function geoIso(geo: GeoFeature): string | null {
  const iso3 = geo.properties?.iso_a3?.toUpperCase();
  if (!iso3) {
    return null;
  }

  return ISO3_TO_ISO2[iso3] ?? null;
}
