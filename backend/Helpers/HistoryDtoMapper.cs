using System.Globalization;

namespace backend.Models;

public static class HistoryDtoMapper
{
    public static HistoryResponse BuildHistoryResponse(
        GenerationChartPoint point,
        string? timeZone = null) =>
        new()
        {
            Date = FormatPeriodDate(point.PeriodStart, timeZone),
            Total = point.Total,
            RenewableMw = point.RenewableMw,
            RenewablePct = point.RenewablePct,
            WindMw = point.WindMw,
            SolarMw = point.SolarMw,
        };

    /// <summary>
    /// Canonical chart bucket key: UTC midnight of the local calendar day the period represents.
    /// Older rows stored timezone-offset PeriodStart values; those are normalized here.
    /// </summary>
    public static DateTime ToCalendarDateKey(DateTime periodStart, string? timeZone = null)
    {
        var utc = DateTime.SpecifyKind(periodStart, DateTimeKind.Utc);

        if (utc.TimeOfDay == TimeSpan.Zero)
        {
            return DateTime.SpecifyKind(utc.Date, DateTimeKind.Utc);
        }

        if (!TryGetTimeZone(timeZone ?? "Europe/Bucharest", out var zone))
        {
            return DateTime.SpecifyKind(utc.Date, DateTimeKind.Utc);
        }

        var localDate = TimeZoneInfo.ConvertTimeFromUtc(utc, zone).Date;
        return DateTime.SpecifyKind(localDate, DateTimeKind.Utc);
    }

    public static string FormatPeriodDate(DateTime periodStart, string? timeZone = null) =>
        ToCalendarDateKey(periodStart, timeZone)
            .ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    public static bool TryGetTimeZone(string timeZone, out TimeZoneInfo zone)
    {
        try
        {
            zone = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            return true;
        }
        catch (TimeZoneNotFoundException)
        {
            zone = TimeZoneInfo.Utc;
            return false;
        }
        catch (InvalidTimeZoneException)
        {
            zone = TimeZoneInfo.Utc;
            return false;
        }
    }
}
