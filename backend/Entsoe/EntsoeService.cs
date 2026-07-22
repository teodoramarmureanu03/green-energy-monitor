using System.Globalization;
using System.Text.Json;
using System.Xml.Linq;
using backend.Models;
using backend.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services;

/// <summary>
/// Integrates with the ENTSO-E Transparency Platform API.
/// Fetches generation data, aggregates it, and persists results through repositories.
/// </summary>
public class EntsoeService
{
    private const int MaxParallelHistoryRequests = 4;
    private const int DailyChartBuckets = 7;
    private const int WeeklyChartBuckets = 5;
    private const int MonthlyChartBuckets = 12;

    private readonly HttpClient _httpClient;
    private readonly IGenerationRepository _generationRepository;
    private readonly IHistoryRepository _historyRepository;
    private readonly IPreferencesRepository _preferencesRepository;
    private readonly ILogger<EntsoeService> _logger;
    private readonly string _apiKey;

    public EntsoeService(
        HttpClient httpClient,
        IConfiguration config,
        IGenerationRepository generationRepository,
        IHistoryRepository historyRepository,
        IPreferencesRepository preferencesRepository,
        ILogger<EntsoeService> logger)
    {
        _httpClient = httpClient;
        _generationRepository = generationRepository;
        _historyRepository = historyRepository;
        _preferencesRepository = preferencesRepository;
        _logger = logger;

        var rawKey = Environment.GetEnvironmentVariable("ENTSOE_API_KEY")
            ?? config["EntsoeApiKey"]
            ?? throw new InvalidOperationException(
                "EntsoeApiKey is missing from configuration.");

        _apiKey = Environment.ExpandEnvironmentVariables(rawKey).Trim();

        if (string.IsNullOrWhiteSpace(_apiKey) ||
            _apiKey.Contains("ENTSOE_API_KEY", StringComparison.Ordinal) ||
            _apiKey.Contains("your_entsoe_api_key", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "ENTSO-E API key is not configured. Add ENTSOE_API_KEY to a .env file next to docker-compose.yml, then run: docker compose up --build");
        }
    }

    /// <summary>
    /// Refreshes live snapshot and chart history for a single country.
    /// </summary>
    public async Task RefreshCountryDataAsync(
        string iso,
        string countryName,
        CancellationToken cancellationToken = default)
    {
        iso = iso.ToUpperInvariant();

        await SaveLiveSnapshotAsync(iso, countryName, cancellationToken);
        await EnsureChartHistoryAsync(iso, countryName, cancellationToken);
    }

    private async Task SaveLiveSnapshotAsync(
        string iso,
        string countryName,
        CancellationToken cancellationToken)
    {
        var zones = await GetZoneCodesOrThrowAsync(iso);
        var sourceMap = await _generationRepository.GetEnergySourceMapAsync();
        var now = DateTime.UtcNow;

        var aggregated = await FetchAverageForIntervalAsync(
            zones,
            sourceMap,
            iso,
            now.AddDays(-1),
            now.AddDays(1),
            cancellationToken);

        var record = new GenerationRecord
        {
            IsoCode = iso,
            CountryName = countryName,
            FetchedAt = DateTime.UtcNow,
            Total = aggregated.Total,
            RenewableMw = aggregated.RenewableMw,
            RenewablePct = aggregated.RenewablePct,
            BySourceJson = JsonSerializer.Serialize(aggregated.BySource),
            ZonesAggregatedJson = JsonSerializer.Serialize(zones),
        };

        await _generationRepository.AddRecordAsync(record, cancellationToken);
    }

    private async Task EnsureChartHistoryAsync(
        string iso,
        string countryName,
        CancellationToken cancellationToken)
    {
        var timeZone = await GetPreferredTimeZoneAsync(cancellationToken);
        var periodsToSync = await GetPeriodsToSyncAsync(iso, timeZone);

        var timeZoneId = timeZone.Id;

        if (periodsToSync.Count == 0)
        {
            await _historyRepository.TrimChartPointsAsync(
                iso,
                DailyChartBuckets,
                WeeklyChartBuckets,
                MonthlyChartBuckets,
                timeZoneId,
                cancellationToken);
            return;
        }

        // Load reference data once. Parallel chart fetches must not share DbContext queries.
        var zones = await GetZoneCodesOrThrowAsync(iso);
        var sourceMap = await _generationRepository.GetEnergySourceMapAsync();
        var apiGate = new SemaphoreSlim(MaxParallelHistoryRequests);

        var fetchTasks = periodsToSync.Select(async period =>
        {
            await apiGate.WaitAsync(cancellationToken);

            try
            {
                // Fetch uses real local-day UTC bounds; PeriodStart stays a calendar date key.
                var aggregated = await FetchAverageForIntervalAsync(
                    zones,
                    sourceMap,
                    iso,
                    period.FetchStart,
                    period.FetchEnd,
                    cancellationToken);

                return new GenerationChartPoint
                {
                    IsoCode = iso,
                    CountryName = countryName,
                    PeriodType = period.PeriodType,
                    PeriodStart = DateTime.SpecifyKind(period.Start, DateTimeKind.Utc),
                    PeriodEnd = DateTime.SpecifyKind(period.End, DateTimeKind.Utc),
                    Total = aggregated.Total,
                    RenewableMw = aggregated.RenewableMw,
                    RenewablePct = aggregated.RenewablePct,
                    WindMw = aggregated.WindMw,
                    SolarMw = aggregated.SolarMw,
                    UpdatedAt = DateTime.UtcNow,
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to fetch {PeriodType} chart point for {Iso} starting {Start:yyyy-MM-dd}",
                    period.PeriodType,
                    iso,
                    period.Start);
                return null;
            }
            finally
            {
                apiGate.Release();
            }
        });

        var newPoints = (await Task.WhenAll(fetchTasks))
            .Where(point => point is not null)
            .Cast<GenerationChartPoint>()
            .ToArray();

        if (newPoints.Length == 0)
        {
            _logger.LogWarning("No chart points were fetched for {Iso}.", iso);
            await _historyRepository.TrimChartPointsAsync(
                iso,
                DailyChartBuckets,
                WeeklyChartBuckets,
                MonthlyChartBuckets,
                timeZoneId,
                cancellationToken);
            return;
        }

        await _historyRepository.AddChartPointsAsync(newPoints, timeZoneId, cancellationToken);

        _logger.LogInformation(
            "Stored {Count} chart points for {Iso}",
            newPoints.Length,
            iso);

        await _historyRepository.TrimChartPointsAsync(
            iso,
            DailyChartBuckets,
            WeeklyChartBuckets,
            MonthlyChartBuckets,
            timeZoneId,
            cancellationToken);
    }

    private async Task<List<ChartPeriodDefinition>> GetPeriodsToSyncAsync(
        string iso,
        TimeZoneInfo timeZone)
    {
        var required = BuildRequiredPeriods(timeZone);
        var existing = await _historyRepository.GetExistingPeriodKeysAsync(iso, timeZone.Id);

        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone).Date;
        var currentWeekStart = ToUtcDate(GetWeekStartLocal(todayLocal));
        var currentMonthStart = ToUtcDate(new DateTime(todayLocal.Year, todayLocal.Month, 1));

        // Day buckets always refresh (rolling 7-day window).
        // Week/month buckets: refresh the current (in-progress) bucket so month/year charts update daily.
        return required
            .Where(period =>
                period.PeriodType == "Day" ||
                (period.PeriodType == "Week" && period.Start == currentWeekStart) ||
                (period.PeriodType == "Month" && period.Start == currentMonthStart) ||
                !existing.Contains((period.PeriodType, period.Start.Date)))
            .ToList();
    }

    private static List<ChartPeriodDefinition> BuildRequiredPeriods(TimeZoneInfo timeZone)
    {
        var periods = new List<ChartPeriodDefinition>();
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone).Date;

        // Today and the previous six days in the preferred viewer timezone.
        // PeriodStart/End are calendar-date keys (UTC midnight of the local date) so chart
        // labels stay on the intended day. FetchStart/End are the real ENTSO-E UTC window.
        for (var offset = DailyChartBuckets - 1; offset >= 0; offset--)
        {
            var startLocal = todayLocal.AddDays(-offset);
            periods.Add(new ChartPeriodDefinition(
                "Day",
                ToUtcDate(startLocal),
                ToUtcDate(startLocal.AddDays(1)),
                LocalDateToUtc(startLocal, timeZone),
                LocalDateToUtc(startLocal.AddDays(1), timeZone)));
        }

        var weekStartLocal = GetWeekStartLocal(todayLocal);

        for (var offset = WeeklyChartBuckets - 1; offset >= 0; offset--)
        {
            var startLocal = weekStartLocal.AddDays(-7 * offset);
            periods.Add(new ChartPeriodDefinition(
                "Week",
                ToUtcDate(startLocal),
                ToUtcDate(startLocal.AddDays(7)),
                LocalDateToUtc(startLocal, timeZone),
                LocalDateToUtc(startLocal.AddDays(7), timeZone)));
        }

        var monthStartLocal = new DateTime(todayLocal.Year, todayLocal.Month, 1);

        for (var offset = MonthlyChartBuckets - 1; offset >= 0; offset--)
        {
            var startLocal = monthStartLocal.AddMonths(-offset);
            periods.Add(new ChartPeriodDefinition(
                "Month",
                ToUtcDate(startLocal),
                ToUtcDate(startLocal.AddMonths(1)),
                LocalDateToUtc(startLocal, timeZone),
                LocalDateToUtc(startLocal.AddMonths(1), timeZone)));
        }

        return periods;
    }

    private async Task<TimeZoneInfo> GetPreferredTimeZoneAsync(
        CancellationToken cancellationToken)
    {
        var preferred = await _preferencesRepository.GetLatestTimeZoneIdAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(preferred) &&
            HistoryDtoMapper.TryGetTimeZone(preferred, out var zone))
        {
            return zone;
        }

        return HistoryDtoMapper.TryGetTimeZone("Europe/Bucharest", out var fallback)
            ? fallback
            : TimeZoneInfo.Utc;
    }

    private async Task<AggregatedGeneration> FetchAverageForIntervalAsync(
        IReadOnlyList<string> zones,
        Dictionary<string, (string Name, bool Renewable)> sourceMap,
        string iso,
        DateTime start,
        DateTime end,
        CancellationToken cancellationToken)
    {
        var valuesByTimestamp = new Dictionary<DateTime, Dictionary<string, double>>();

        var xmlDocuments = await Task.WhenAll(
            zones.Select(zone => FetchZoneHistoryXmlAsync(zone, start, end, cancellationToken)));

        foreach (var xml in xmlDocuments)
        {
            MergeZoneHistory(valuesByTimestamp, ParseZoneHistory(xml));
        }

        if (valuesByTimestamp.Count == 0)
        {
            throw new InvalidOperationException(
                $"No ENTSO-E data returned for {iso} between {start:yyyy-MM-dd} and {end:yyyy-MM-dd}.");
        }

        var averageBySource = valuesByTimestamp
            .Select(entry => TranslateSources(entry.Value, sourceMap))
            .SelectMany(sources => sources)
            .GroupBy(source => source.Source)
            .Select(group => new SourceBreakdown
            {
                Source = group.Key,
                Renewable = group.First().Renewable,
                ValueMw = Math.Round(group.Average(item => item.ValueMw), 1),
            })
            .ToList();

        var total = averageBySource.Sum(source => source.ValueMw);
        var renewableMw = averageBySource
            .Where(source => source.Renewable)
            .Sum(source => source.ValueMw);

        var renewablePct = total > 0
            ? Math.Round(renewableMw / total * 100, 1)
            : 0;

        var windMw = averageBySource
            .Where(source => source.Source is "Wind onshore" or "Wind offshore")
            .Sum(source => source.ValueMw);

        var solarMw = averageBySource
            .Where(source => source.Source == "Solar")
            .Sum(source => source.ValueMw);

        return new AggregatedGeneration
        {
            Total = Math.Round(total, 1),
            RenewableMw = Math.Round(renewableMw, 1),
            RenewablePct = renewablePct,
            WindMw = Math.Round(windMw, 1),
            SolarMw = Math.Round(solarMw, 1),
            BySource = averageBySource,
        };
    }

    private async Task<IReadOnlyList<string>> GetZoneCodesOrThrowAsync(string iso)
    {
        var zones = await _generationRepository.GetZoneCodesAsync(iso);

        if (zones.Count == 0)
        {
            throw new InvalidOperationException(
                $"No ENTSO-E zone codes configured in the database for {iso}.");
        }

        return zones;
    }

    private async Task<string> FetchZoneHistoryXmlAsync(
        string zoneCode,
        DateTime start,
        DateTime end,
        CancellationToken cancellationToken)
    {
        var startString = start.ToUniversalTime().ToString("yyyyMMddHHmm");
        var endString = end.ToUniversalTime().ToString("yyyyMMddHHmm");

        var url =
            "https://web-api.tp.entsoe.eu/api" +
            "?documentType=A75" +
            "&processType=A16" +
            $"&in_Domain={zoneCode}" +
            $"&periodStart={startString}" +
            $"&periodEnd={endString}" +
            $"&securityToken={_apiKey}";

        return await _httpClient.GetStringAsync(url, cancellationToken);
    }

    private static void MergeZoneHistory(
        Dictionary<DateTime, Dictionary<string, double>> target,
        Dictionary<DateTime, Dictionary<string, double>> zoneHistory)
    {
        foreach (var (timestamp, sources) in zoneHistory)
        {
            if (!target.TryGetValue(timestamp, out var mergedSources))
            {
                mergedSources = new Dictionary<string, double>();
                target[timestamp] = mergedSources;
            }

            foreach (var (sourceCode, value) in sources)
            {
                mergedSources[sourceCode] = mergedSources.GetValueOrDefault(sourceCode) + value;
            }
        }
    }

    private static Dictionary<DateTime, Dictionary<string, double>> ParseZoneHistory(string xmlText)
    {
        var result = new Dictionary<DateTime, Dictionary<string, double>>();
        var document = XDocument.Parse(xmlText);
        var ns = document.Root!.Name.Namespace;

        foreach (var timeSeries in document.Descendants(ns + "TimeSeries"))
        {
            var psrType = timeSeries
                .Descendants(ns + "psrType")
                .FirstOrDefault()
                ?.Value;

            if (psrType is null)
            {
                continue;
            }

            foreach (var period in timeSeries.Descendants(ns + "Period"))
            {
                var startValue = period
                    .Element(ns + "timeInterval")
                    ?.Element(ns + "start")
                    ?.Value;

                var resolutionValue = period
                    .Element(ns + "resolution")
                    ?.Value;

                if (startValue is null || resolutionValue is null)
                {
                    continue;
                }

                var startTime = DateTime
                    .Parse(startValue, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal)
                    .ToUniversalTime();

                var interval = ParseResolution(resolutionValue);

                foreach (var point in period.Elements(ns + "Point"))
                {
                    var positionText = point.Element(ns + "position")?.Value;
                    var quantityText = point.Element(ns + "quantity")?.Value;

                    if (!int.TryParse(positionText, out var position) ||
                        !double.TryParse(
                            quantityText,
                            NumberStyles.Any,
                            CultureInfo.InvariantCulture,
                            out var quantity))
                    {
                        continue;
                    }

                    var pointTime = startTime.Add(
                        TimeSpan.FromTicks(interval.Ticks * (position - 1)));

                    if (!result.TryGetValue(pointTime, out var sourceValues))
                    {
                        sourceValues = new Dictionary<string, double>();
                        result[pointTime] = sourceValues;
                    }

                    sourceValues[psrType] = sourceValues.GetValueOrDefault(psrType) + quantity;
                }
            }
        }

        return result;
    }

    private static TimeSpan ParseResolution(string resolution) =>
        resolution switch
        {
            "PT15M" => TimeSpan.FromMinutes(15),
            "PT30M" => TimeSpan.FromMinutes(30),
            "PT60M" or "PT1H" => TimeSpan.FromHours(1),
            _ => throw new InvalidOperationException($"Unsupported ENTSO-E resolution: {resolution}"),
        };

    private static List<SourceBreakdown> TranslateSources(
        Dictionary<string, double> rawSources,
        Dictionary<string, (string Name, bool Renewable)> sourceMap)
    {
        var result = new List<SourceBreakdown>();

        foreach (var (code, valueMw) in rawSources)
        {
            if (!sourceMap.TryGetValue(code, out var sourceInfo))
            {
                continue;
            }

            result.Add(new SourceBreakdown
            {
                Source = sourceInfo.Name,
                Renewable = sourceInfo.Renewable,
                ValueMw = Math.Round(valueMw, 1),
            });
        }

        return result;
    }

    private static DateTime GetWeekStartLocal(DateTime localDate)
    {
        var daysFromMonday = (7 + (localDate.DayOfWeek - DayOfWeek.Monday)) % 7;
        return localDate.Date.AddDays(-daysFromMonday);
    }

    private static DateTime LocalDateToUtc(DateTime localDate, TimeZoneInfo timeZone)
    {
        var unspecified = DateTime.SpecifyKind(localDate.Date, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, timeZone);
    }

    private static DateTime ToUtcDate(DateTime date) =>
        DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

    private sealed class AggregatedGeneration
    {
        public double Total { get; init; }
        public double RenewableMw { get; init; }
        public double RenewablePct { get; init; }
        public double WindMw { get; init; }
        public double SolarMw { get; init; }
        public List<SourceBreakdown> BySource { get; init; } = new();
    }

    private sealed record ChartPeriodDefinition(
        string PeriodType,
        DateTime Start,
        DateTime End,
        DateTime FetchStart,
        DateTime FetchEnd);
}
