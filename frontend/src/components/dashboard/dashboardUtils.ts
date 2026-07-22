import type {
  GenerationHistoryApiPoint,
  GenerationHistoryPoint,
  HistoryPeriod,
  SourceBreakdown,
} from "@/types/contract";

export interface AggregatedSources {
  windMw: number;
  solarMw: number;
}

export function aggregateSources(
  sources: SourceBreakdown[]
): AggregatedSources {
  let windMw = 0;
  let solarMw = 0;

  for (const source of sources) {
    if (source.source === "Wind onshore" || source.source === "Wind offshore") {
      windMw += source.valueMw;
    }

    if (source.source === "Solar") {
      solarMw += source.valueMw;
    }
  }

  return {
    windMw,
    solarMw,
  };
}

export function formatMw(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return Math.round(value).toLocaleString("en-GB");
}

export function formatCompactMw(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(Math.round(value));
}

export function formatDateTime(
  timestamp: string,
  timeZone?: string
): string {
  return new Date(timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function getSourcePercentages(windMw: number, solarMw: number) {
  const total = windMw + solarMw;

  if (total <= 0) {
    return {
      windPct: 0,
      solarPct: 0,
    };
  }

  const windPct = Math.round((windMw / total) * 100);

  return {
    windPct,
    solarPct: 100 - windPct,
  };
}

export function parseHistoryPoints(
  points: GenerationHistoryApiPoint[],
  period: HistoryPeriod,
  timeZone = "UTC"
): GenerationHistoryPoint[] {
  // One row per chart bucket; labels depend on whether we show days, weeks, or months.
  return points
    .map((point) => {
      const date = parseDateKey(point.date);

      return {
        date: point.date,

        label: formatChartLabel(date, period, timeZone),

        tooltipLabel: formatTooltipLabel(date, period, timeZone),

        total: point.total,
        renewableMw: point.renewableMw,
        windMw: point.windMw,
        solarMw: point.solarMw,
      };
    })
    .sort((first, second) => first.date.localeCompare(second.date));
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatChartLabel(
  date: Date,
  period: HistoryPeriod,
  _timeZone: string
): string {
  // Date keys from the API are calendar dates (UTC midnight). Format in UTC so
  // viewer timezones never shift the chart day backward/forward.
  if (period === "week") {
    return formatCalendarDate(date, {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  }

  if (period === "month") {
    // Each point is a weekly average — show the week span on the axis.
    return formatWeekRangeLabel(date, { includeYear: false });
  }

  return formatCalendarDate(date, {
    month: "short",
  });
}

function formatTooltipLabel(
  date: Date,
  period: HistoryPeriod,
  _timeZone: string
): string {
  if (period === "week") {
    return formatCalendarDate(date, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  if (period === "month") {
    return `Week of ${formatWeekRangeLabel(date, { includeYear: true })}`;
  }

  return formatCalendarDate(date, {
    month: "long",
    year: "numeric",
  });
}

function formatWeekRangeLabel(
  weekStart: Date,
  options: { includeYear: boolean }
): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  const startOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const endOpts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    ...(options.includeYear ? { year: "numeric" } : {}),
  };

  return `${formatCalendarDate(weekStart, startOpts)} – ${formatCalendarDate(weekEnd, endOpts)}`;
}

function formatCalendarDate(
  date: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: "UTC",
  }).format(date);
}
