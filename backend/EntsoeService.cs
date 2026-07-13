using System.Globalization;
using System.Text.Json;
using System.Xml.Linq;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace backend.Services;

public class EntsoeService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    private static readonly Dictionary<
        string,
        (string Name, bool Renewable)
    > SourceMap = new()
    {
        ["B01"] = ("Biomass", true),
        ["B02"] = ("Fossil brown coal", false),
        ["B03"] = ("Fossil coal-derived gas", false),
        ["B04"] = ("Fossil gas", false),
        ["B05"] = ("Fossil hard coal", false),
        ["B06"] = ("Fossil oil", false),
        ["B07"] = ("Fossil oil shale", false),
        ["B08"] = ("Fossil peat", false),
        ["B09"] = ("Geothermal", true),
        ["B10"] = ("Hydro pumped storage", false),
        ["B11"] = ("Hydro Run-of-River", true),
        ["B12"] = ("Hydro water reservoir", true),
        ["B13"] = ("Marine", true),
        ["B14"] = ("Nuclear", false),
        ["B15"] = ("Other renewable", true),
        ["B16"] = ("Solar", true),
        ["B17"] = ("Waste", false),
        ["B18"] = ("Wind offshore", true),
        ["B19"] = ("Wind onshore", true),
        ["B20"] = ("Other", false),
    };

    private static readonly Dictionary<string, string[]> ZoneCodes = new()
    {
        ["AT"] = new[] { "10YAT-APG------L" },
        ["BE"] = new[] { "10YBE----------2" },
        ["BG"] = new[] { "10YCA-BULGARIA-R" },
        ["CH"] = new[] { "10YCH-SWISSGRIDZ" },
        ["CZ"] = new[] { "10YCZ-CEPS-----N" },
        ["DE"] = new[] { "10Y1001A1001A83F" },
        ["DK"] = new[]
        {
            "10YDK-1--------W",
            "10YDK-2--------M"
        },
        ["EE"] = new[] { "10Y1001A1001A39I" },
        ["ES"] = new[] { "10YES-REE------0" },
        ["FI"] = new[] { "10YFI-1--------U" },
        ["FR"] = new[] { "10YFR-RTE------C" },
        ["GR"] = new[] { "10YGR-HTSO-----Y" },
        ["HR"] = new[] { "10YHR-HEP------M" },
        ["HU"] = new[] { "10YHU-MAVIR----U" },
        ["IE"] = new[] { "10Y1001A1001A59C" },
        ["IT"] = new[]
        {
            "10Y1001A1001A73I",
            "10Y1001A1001A70O",
            "10Y1001A1001A71M",
            "10Y1001A1001A788",
            "10Y1001A1001A75E",
            "10Y1001A1001A74G",
        },
        ["LT"] = new[] { "10YLT-1001A0008Q" },
        ["LV"] = new[] { "10YLV-1001A00074" },
        ["NL"] = new[] { "10YNL----------L" },
        ["NO"] = new[]
        {
            "10YNO-1--------2",
            "10YNO-2--------T",
            "10YNO-3--------J",
            "10YNO-4--------9",
            "10Y1001A1001A48H",
        },
        ["PL"] = new[] { "10YPL-AREA-----S" },
        ["PT"] = new[] { "10YPT-REN------W" },
        ["RO"] = new[] { "10YRO-TEL------P" },
        ["SE"] = new[]
        {
            "10Y1001A1001A44P",
            "10Y1001A1001A45N",
            "10Y1001A1001A46L",
            "10Y1001A1001A47J",
        },
        ["SI"] = new[] { "10YSI-ELES-----O" },
        ["SK"] = new[] { "10YSK-SEPS-----K" },
    };

    public EntsoeService(
        HttpClient httpClient,
        IConfiguration config
    )
    {
        _httpClient = httpClient;

        var rawKey = config["EntsoeApiKey"]
            ?? throw new Exception("EntsoeApiKey missing");

        _apiKey = Environment.ExpandEnvironmentVariables(rawKey);
    }

    public async Task<CountryGeneration?> GetFromDatabaseAsync(
        string iso,
        EnergyDbContext db
    )
    {
        iso = iso.ToUpper();

        var record = await db.GenerationRecords
            .AsNoTracking()
            .Where(item => item.IsoCode == iso)
            .OrderByDescending(item => item.FetchedAt)
            .FirstOrDefaultAsync();

        return record != null
            ? MapRecordToDto(record)
            : null;
    }

    public async Task RefreshCountryDataAsync(
        string iso,
        string countryName,
        EnergyDbContext db,
        CancellationToken cancellationToken = default
    )
    {
        cancellationToken.ThrowIfCancellationRequested();

        await FetchAndSaveAsync(
            iso,
            countryName,
            db
        );

        cancellationToken.ThrowIfCancellationRequested();

        await EnsureChartHistoryAsync(
            iso,
            countryName,
            db,
            cancellationToken
        );
    }

    public async Task<CountryGeneration> FetchAndSaveAsync(
        string iso,
        string countryName,
        EnergyDbContext db
    )
    {
        iso = iso.ToUpper();

        if (!ZoneCodes.ContainsKey(iso))
        {
            throw new Exception($"No EIC code for {iso}");
        }

        var now = DateTime.UtcNow;
        var start = now.AddDays(-1);
        var end = now.AddDays(1);

        var result = await FetchAverageForIntervalAsync(
            iso,
            start,
            end
        );

        var zones = ZoneCodes[iso];

        var newRecord = new GenerationRecord
        {
            IsoCode = iso,
            CountryName = countryName,
            FetchedAt = DateTime.UtcNow,
            Total = result.Total,
            RenewableMw = result.RenewableMw,
            RenewablePct = result.RenewablePct,
            BySourceJson = JsonSerializer.Serialize(
                result.BySource
            ),
            ZonesAggregatedJson = JsonSerializer.Serialize(
                zones.ToList()
            )
        };

        db.GenerationRecords.Add(newRecord);
        await db.SaveChangesAsync();

        return MapRecordToDto(newRecord);
    }

    public async Task EnsureChartHistoryAsync(
        string iso,
        string countryName,
        EnergyDbContext db,
        CancellationToken cancellationToken = default
    )
    {
        iso = iso.ToUpper();

        var missingPeriods = await GetMissingPeriodsAsync(
            iso,
            db
        );

        if (missingPeriods.Count > 0)
        {
            var apiGate = new SemaphoreSlim(4);

            var fetchTasks = missingPeriods.Select(
                async period =>
                {
                    await apiGate.WaitAsync(
                        cancellationToken
                    );

                    try
                    {
                        var result =
                            await FetchAverageForIntervalAsync(
                                iso,
                                period.Start,
                                period.End
                            );

                        return new GenerationChartPoint
                        {
                            IsoCode = iso,
                            CountryName = countryName,
                            PeriodType = period.PeriodType,
                            PeriodStart = period.Start,
                            PeriodEnd = period.End,
                            Total = result.Total,
                            RenewableMw = result.RenewableMw,
                            RenewablePct = result.RenewablePct,
                            WindMw = result.WindMw,
                            SolarMw = result.SolarMw,
                            UpdatedAt = DateTime.UtcNow
                        };
                    }
                    finally
                    {
                        apiGate.Release();
                    }
                }
            );

            var newPoints = await Task.WhenAll(
                fetchTasks
            );

            db.GenerationChartPoints.AddRange(
                newPoints
            );

            await db.SaveChangesAsync(
                cancellationToken
            );

            Console.WriteLine(
                $"[{iso}] Stored {newPoints.Length} " +
                "new chart points."
            );
        }

        await RemoveObsoleteChartPointsAsync(
            iso,
            db,
            cancellationToken
        );
    }

    private async Task<
        List<ChartPeriodDefinition>
    > GetMissingPeriodsAsync(
        string iso,
        EnergyDbContext db
    )
    {
        var requiredPeriods = BuildRequiredPeriods();

        var existingStarts =
            await db.GenerationChartPoints
                .AsNoTracking()
                .Where(point => point.IsoCode == iso)
                .Select(point => new
                {
                    point.PeriodType,
                    point.PeriodStart
                })
                .ToListAsync();

        var existingKeys = existingStarts
            .Select(point =>
                (
                    point.PeriodType,
                    point.PeriodStart
                )
            )
            .ToHashSet();

        return requiredPeriods
            .Where(period =>
                !existingKeys.Contains(
                    (
                        period.PeriodType,
                        period.Start
                    )
                )
            )
            .ToList();
    }

    private static List<ChartPeriodDefinition>
        BuildRequiredPeriods()
    {
        var periods = new List<ChartPeriodDefinition>();
        var today = DateTime.UtcNow.Date;

        for (var offset = 7; offset >= 1; offset--)
        {
            var start = today.AddDays(-offset);

            periods.Add(new ChartPeriodDefinition(
                "Day",
                start,
                start.AddDays(1)
            ));
        }

        var currentWeekStart = GetWeekStart(today);

        for (var offset = 5; offset >= 1; offset--)
        {
            var start = currentWeekStart.AddDays(
                -7 * offset
            );

            periods.Add(new ChartPeriodDefinition(
                "Week",
                start,
                start.AddDays(7)
            ));
        }

        var currentMonthStart = new DateTime(
            DateTime.UtcNow.Year,
            DateTime.UtcNow.Month,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc
        );

        for (var offset = 12; offset >= 1; offset--)
        {
            var start = currentMonthStart.AddMonths(
                -offset
            );

            periods.Add(new ChartPeriodDefinition(
                "Month",
                start,
                start.AddMonths(1)
            ));
        }

        return periods;
    }

    private async Task RemoveObsoleteChartPointsAsync(
        string iso,
        EnergyDbContext db,
        CancellationToken cancellationToken = default
    )
    {
        var dailyPoints = await db.GenerationChartPoints
            .Where(point =>
                point.IsoCode == iso &&
                point.PeriodType == "Day"
            )
            .OrderByDescending(point => point.PeriodStart)
            .Skip(7)
            .ToListAsync();

        var weeklyPoints = await db.GenerationChartPoints
            .Where(point =>
                point.IsoCode == iso &&
                point.PeriodType == "Week"
            )
            .OrderByDescending(point => point.PeriodStart)
            .Skip(5)
            .ToListAsync();

        var monthlyPoints = await db.GenerationChartPoints
            .Where(point =>
                point.IsoCode == iso &&
                point.PeriodType == "Month"
            )
            .OrderByDescending(point => point.PeriodStart)
            .Skip(12)
            .ToListAsync();

        db.GenerationChartPoints.RemoveRange(
            dailyPoints
        );

        db.GenerationChartPoints.RemoveRange(
            weeklyPoints
        );

        db.GenerationChartPoints.RemoveRange(
            monthlyPoints
        );

        await db.SaveChangesAsync(
            cancellationToken
        );
    }

    private async Task<AggregatedGeneration> FetchAverageForIntervalAsync(
        string iso,
        DateTime start,
        DateTime end
    )
    {
        if (!ZoneCodes.TryGetValue(iso, out var zones))
        {
            throw new Exception(
                $"No EIC code configured for {iso}"
            );
        }

        var valuesByTimestamp =
            new Dictionary<
                DateTime,
                Dictionary<string, double>
            >();

        var zoneXmlTasks = zones
            .Select(zone =>
                FetchZoneHistoryXml(
                    zone,
                    start,
                    end
                )
            )
            .ToList();

        var zoneXmlResults = await Task.WhenAll(
            zoneXmlTasks
        );

        foreach (var xml in zoneXmlResults)
        {
            var zoneHistory = ParseZoneHistory(xml);

            foreach (var timestampEntry in zoneHistory)
            {
                if (!valuesByTimestamp.TryGetValue(
                        timestampEntry.Key,
                        out var sourcesAtTimestamp
                    ))
                {
                    sourcesAtTimestamp =
                        new Dictionary<string, double>();

                    valuesByTimestamp[
                        timestampEntry.Key
                    ] = sourcesAtTimestamp;
                }

                foreach (var sourceEntry in timestampEntry.Value)
                {
                    if (!sourcesAtTimestamp.ContainsKey(
                            sourceEntry.Key
                        ))
                    {
                        sourcesAtTimestamp[sourceEntry.Key] = 0;
                    }

                    sourcesAtTimestamp[sourceEntry.Key] +=
                        sourceEntry.Value;
                }
            }
        }

        if (valuesByTimestamp.Count == 0)
        {
            throw new Exception(
                $"No historical values returned for {iso} " +
                $"between {start:yyyy-MM-dd} and {end:yyyy-MM-dd}"
            );
        }

        var translatedRows = valuesByTimestamp
            .Select(timestampEntry =>
                TranslateSources(timestampEntry.Value)
            )
            .ToList();

        var averageBySource = translatedRows
            .SelectMany(row => row)
            .GroupBy(source => source.Source)
            .Select(group => new SourceBreakdown
            {
                Source = group.Key,
                Renewable = group.First().Renewable,
                ValueMw = Math.Round(
                    group.Average(item => item.ValueMw),
                    1
                )
            })
            .ToList();

        var total = averageBySource.Sum(
            source => source.ValueMw
        );

        var renewableMw = averageBySource
            .Where(source => source.Renewable)
            .Sum(source => source.ValueMw);

        var renewablePct = total > 0
            ? Math.Round(
                renewableMw / total * 100,
                1
            )
            : 0;

        var windMw = averageBySource
            .Where(source =>
                source.Source == "Wind onshore" ||
                source.Source == "Wind offshore"
            )
            .Sum(source => source.ValueMw);

        var solarMw = averageBySource
            .Where(source =>
                source.Source == "Solar"
            )
            .Sum(source => source.ValueMw);

        return new AggregatedGeneration
        {
            Total = Math.Round(total, 1),
            RenewableMw = Math.Round(
                renewableMw,
                1
            ),
            RenewablePct = renewablePct,
            WindMw = Math.Round(windMw, 1),
            SolarMw = Math.Round(solarMw, 1),
            BySource = averageBySource
        };
    }

    private async Task<string> FetchZoneHistoryXml(
        string zoneCode,
        DateTime start,
        DateTime end
    )
    {
        var startString =
            start.ToUniversalTime()
                .ToString("yyyyMMddHHmm");

        var endString =
            end.ToUniversalTime()
                .ToString("yyyyMMddHHmm");

        var url =
            "https://web-api.tp.entsoe.eu/api" +
            "?documentType=A75" +
            "&processType=A16" +
            $"&in_Domain={zoneCode}" +
            $"&periodStart={startString}" +
            $"&periodEnd={endString}" +
            $"&securityToken={_apiKey}";

        return await _httpClient.GetStringAsync(url);
    }

    private Dictionary<
        DateTime,
        Dictionary<string, double>
    > ParseZoneHistory(string xmlText)
    {
        var result =
            new Dictionary<
                DateTime,
                Dictionary<string, double>
            >();

        var document = XDocument.Parse(xmlText);
        var ns = document.Root!.Name.Namespace;

        foreach (
            var timeSeries in document.Descendants(
                ns + "TimeSeries"
            )
        )
        {
            var psrType = timeSeries
                .Descendants(ns + "psrType")
                .FirstOrDefault()
                ?.Value;

            if (psrType == null)
            {
                continue;
            }

            foreach (
                var period in timeSeries.Descendants(
                    ns + "Period"
                )
            )
            {
                var startValue = period
                    .Element(ns + "timeInterval")
                    ?.Element(ns + "start")
                    ?.Value;

                var resolutionValue = period
                    .Element(ns + "resolution")
                    ?.Value;

                if (
                    startValue == null ||
                    resolutionValue == null
                )
                {
                    continue;
                }

                var startTime = DateTime
                    .Parse(
                        startValue,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.AdjustToUniversal
                    )
                    .ToUniversalTime();

                var interval =
                    ParseResolution(resolutionValue);

                foreach (
                    var point in period.Elements(
                        ns + "Point"
                    )
                )
                {
                    var positionText = point
                        .Element(ns + "position")
                        ?.Value;

                    var quantityText = point
                        .Element(ns + "quantity")
                        ?.Value;

                    if (
                        !int.TryParse(
                            positionText,
                            out var position
                        ) ||
                        !double.TryParse(
                            quantityText,
                            NumberStyles.Any,
                            CultureInfo.InvariantCulture,
                            out var quantity
                        )
                    )
                    {
                        continue;
                    }

                    var pointTime = startTime.Add(
                        TimeSpan.FromTicks(
                            interval.Ticks *
                            (position - 1)
                        )
                    );

                    if (!result.TryGetValue(
                            pointTime,
                            out var sourceValues
                        ))
                    {
                        sourceValues =
                            new Dictionary<string, double>();

                        result[pointTime] =
                            sourceValues;
                    }

                    if (!sourceValues.ContainsKey(
                            psrType
                        ))
                    {
                        sourceValues[psrType] = 0;
                    }

                    sourceValues[psrType] += quantity;
                }
            }
        }

        return result;
    }

    private static TimeSpan ParseResolution(
        string resolution
    )
    {
        if (resolution == "PT15M")
        {
            return TimeSpan.FromMinutes(15);
        }

        if (resolution == "PT30M")
        {
            return TimeSpan.FromMinutes(30);
        }

        if (resolution == "PT60M" ||
            resolution == "PT1H")
        {
            return TimeSpan.FromHours(1);
        }

        throw new Exception(
            $"Unsupported ENTSO-E resolution: {resolution}"
        );
    }

    private static List<SourceBreakdown> TranslateSources(
        Dictionary<string, double> rawSources
    )
    {
        var result = new List<SourceBreakdown>();

        foreach (var sourceEntry in rawSources)
        {
            if (!SourceMap.TryGetValue(
                    sourceEntry.Key,
                    out var sourceInfo
                ))
            {
                continue;
            }

            result.Add(new SourceBreakdown
            {
                Source = sourceInfo.Name,
                Renewable = sourceInfo.Renewable,
                ValueMw = Math.Round(
                    sourceEntry.Value,
                    1
                )
            });
        }

        return result;
    }

    private static DateTime GetWeekStart(
        DateTime date
    )
    {
        var difference =
            (7 +
             (date.DayOfWeek - DayOfWeek.Monday))
            % 7;

        return date.Date.AddDays(-difference);
    }

    private static CountryGeneration MapRecordToDto(
        GenerationRecord record
    )
    {
        var bySource =
            JsonSerializer.Deserialize<
                List<SourceBreakdown>
            >(record.BySourceJson)
            ?? new List<SourceBreakdown>();

        var zones =
            JsonSerializer.Deserialize<List<string>>(
                record.ZonesAggregatedJson
            )
            ?? new List<string>();

        return new CountryGeneration
        {
            IsoCode = record.IsoCode,
            Country = record.CountryName,
            Timestamp = record.FetchedAt.ToString("o"),
            ZonesAggregated = zones,
            Total = record.Total,
            RenewableMw = record.RenewableMw,
            RenewablePct = record.RenewablePct,
            BySource = bySource
        };
    }

    private sealed class AggregatedGeneration
    {
        public double Total { get; init; }
        public double RenewableMw { get; init; }
        public double RenewablePct { get; init; }
        public double WindMw { get; init; }
        public double SolarMw { get; init; }

        public List<SourceBreakdown> BySource { get; init; } =
            new();
    }

    private sealed record ChartPeriodDefinition(
        string PeriodType,
        DateTime Start,
        DateTime End
    );
}
