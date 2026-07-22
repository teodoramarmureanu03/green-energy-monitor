export interface TimezoneOption {
  isoCode: string;
  name: string;
  timeZone: string;
}

/** Countries users can pick as their viewing location (IANA time zones). */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { isoCode: "AT", name: "Austria", timeZone: "Europe/Vienna" },
  { isoCode: "BE", name: "Belgium", timeZone: "Europe/Brussels" },
  { isoCode: "BG", name: "Bulgaria", timeZone: "Europe/Sofia" },
  { isoCode: "CH", name: "Switzerland", timeZone: "Europe/Zurich" },
  { isoCode: "CN", name: "China", timeZone: "Asia/Shanghai" },
  { isoCode: "CZ", name: "Czechia", timeZone: "Europe/Prague" },
  { isoCode: "DE", name: "Germany", timeZone: "Europe/Berlin" },
  { isoCode: "DK", name: "Denmark", timeZone: "Europe/Copenhagen" },
  { isoCode: "EE", name: "Estonia", timeZone: "Europe/Tallinn" },
  { isoCode: "ES", name: "Spain", timeZone: "Europe/Madrid" },
  { isoCode: "FI", name: "Finland", timeZone: "Europe/Helsinki" },
  { isoCode: "FR", name: "France", timeZone: "Europe/Paris" },
  { isoCode: "GR", name: "Greece", timeZone: "Europe/Athens" },
  { isoCode: "HR", name: "Croatia", timeZone: "Europe/Zagreb" },
  { isoCode: "HU", name: "Hungary", timeZone: "Europe/Budapest" },
  { isoCode: "IE", name: "Ireland", timeZone: "Europe/Dublin" },
  { isoCode: "IT", name: "Italy", timeZone: "Europe/Rome" },
  { isoCode: "LT", name: "Lithuania", timeZone: "Europe/Vilnius" },
  { isoCode: "LV", name: "Latvia", timeZone: "Europe/Riga" },
  { isoCode: "NL", name: "Netherlands", timeZone: "Europe/Amsterdam" },
  { isoCode: "NO", name: "Norway", timeZone: "Europe/Oslo" },
  { isoCode: "PL", name: "Poland", timeZone: "Europe/Warsaw" },
  { isoCode: "PT", name: "Portugal", timeZone: "Europe/Lisbon" },
  { isoCode: "RO", name: "Romania", timeZone: "Europe/Bucharest" },
  { isoCode: "SE", name: "Sweden", timeZone: "Europe/Stockholm" },
  { isoCode: "SI", name: "Slovenia", timeZone: "Europe/Ljubljana" },
  { isoCode: "SK", name: "Slovakia", timeZone: "Europe/Bratislava" },
];

export const DEFAULT_TIMEZONE_ISO = "RO";

export function getTimezoneOption(isoCode: string): TimezoneOption {
  return (
    TIMEZONE_OPTIONS.find(
      (option) => option.isoCode === isoCode.toUpperCase()
    ) ??
    TIMEZONE_OPTIONS.find((option) => option.isoCode === DEFAULT_TIMEZONE_ISO)!
  );
}

export function formatInTimeZone(
  date: Date | string | number,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone,
  }).format(new Date(date));
}
