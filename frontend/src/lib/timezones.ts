/** All IANA time zones from the browser (Europe/Bucharest, America/New_York, …). */
export const ALL_TIMEZONES: string[] =
  typeof Intl !== "undefined" && "supportedValuesOf" in Intl
    ? Intl.supportedValuesOf("timeZone")
    : ["Europe/Bucharest", "Europe/London", "America/New_York", "UTC"];

export function getUserLocalTimezone(): string {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Bucharest"
    );
  } catch {
    return "Europe/Bucharest";
  }
}

export function formatInTimeZone(
  date: Date | string | number,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      ...options,
      timeZone,
    }).format(new Date(date));
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      ...options,
      timeZone: "UTC",
    }).format(new Date(date));
  }
}
