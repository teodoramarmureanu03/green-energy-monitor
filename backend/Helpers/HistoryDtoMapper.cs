namespace backend.Models;

public static class HistoryDtoMapper
{
    public static HistoryDto BuildHistoryDto(GenerationChartPoint point) =>
        new()
        {
            Date = point.PeriodStart.ToString("yyyy-MM-dd"),
            Total = point.Total,
            RenewableMw = point.RenewableMw,
            RenewablePct = point.RenewablePct,
            WindMw = point.WindMw,
            SolarMw = point.SolarMw,
        };
}
