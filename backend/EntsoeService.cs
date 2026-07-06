using System.Xml.Linq;
using System.Globalization;
using System.Text.Json;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend;

public class EntsoeService
{
    private readonly HttpClient _http = new();
    private readonly string _apiKey;
    private readonly IServiceScopeFactory _scopeFactory;

    public EntsoeService(string apiKey, IServiceScopeFactory scopeFactory)
    {
        _apiKey = apiKey;
        _scopeFactory = scopeFactory;
    }

    private static readonly Dictionary<string, (string Name, bool Renewable)> SourceMap = new()
    {
        ["B01"] = ("Biomass", true),
        ["B02"] = ("Fossil brown coal", false),
        ["B03"] = ("Fossil coal-derived gas", false),
        ["B04"] = ("Fossil gas", false),
        ["B05"] = ("Fossil hard coal", false),
        ["B06"] = ("Fossil oil", false),
        ["B09"] = ("Geothermal", true),
        ["B10"] = ("Hydro pumped storage", true),
        ["B11"] = ("Hydro Run-of-River", true),
        ["B12"] = ("Hydro water reservoir", true),
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
        ["DK"] = new[] { "10YDK-1--------W", "10YDK-2--------M" },
        ["EE"] = new[] { "10Y1001A1001A39I" },
        ["ES"] = new[] { "10YES-REE------0" },
        ["FI"] = new[] { "10YFI-1--------U" },
        ["FR"] = new[] { "10YFR-RTE------C" },
        ["GR"] = new[] { "10YGR-HTSO-----Y" },
        ["HR"] = new[] { "10YHR-HEP------M" },
        ["HU"] = new[] { "10YHU-MAVIR----U" },
        ["IE"] = new[] { "10Y1001A1001A59C" },
        ["IT"] = new[] {
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
        ["NO"] = new[] {
            "10YNO-1--------2",
            "10YNO-2--------T",
            "10YNO-3--------J",
            "10YNO-4--------9",
            "10Y1001A1001A48H",
        },
        ["PL"] = new[] { "10YPL-AREA-----S" },
        ["PT"] = new[] { "10YPT-REN------W" },
        ["RO"] = new[] { "10YRO-TEL------P" },
        ["SE"] = new[] {
            "10Y1001A1001A44P",
            "10Y1001A1001A45N",
            "10Y1001A1001A46L",
            "10Y1001A1001A47J",
        },
        ["SI"] = new[] { "10YSI-ELES-----O" },
        ["SK"] = new[] { "10YSK-SEPS-----K" },
    };

    // -----------------------------------------------------------------------
    // GetGenerationAsync — called by the API endpoint.
    // Always reads from the database and returns immediately.
    // Never calls ENTSO-E — that is done only by the scheduled refresh loop.
    // If no data exists yet (very first startup before warm-up finishes),
    // fetches once and waits, then never blocks again.
    // -----------------------------------------------------------------------
    public async Task<CountryGeneration> GetGenerationAsync(string iso, string countryName)
    {
        iso = iso.ToUpper();

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EnergyDbContext>();

        var record = await db.GenerationRecords
            .FirstOrDefaultAsync(r => r.IsoCode == iso);

        // Data exists — return from DB immediately, no API call
        if (record != null)
            return MapRecordToDto(record);

        // No data yet (first startup) — fetch once and save
        return await FetchAndSaveAsync(iso, countryName, db, null);
    }

    // -----------------------------------------------------------------------
    // FetchAndSaveAsync — called only by the scheduled refresh loop in
    // Program.cs (every 15 minutes) and during first-run warm-up.
    // Never called during a user request (except very first startup).
    // -----------------------------------------------------------------------
    public async Task<CountryGeneration> FetchAndSaveAsync(
        string iso, string countryName, EnergyDbContext db, GenerationRecord? existing)
    {
        if (!ZoneCodes.ContainsKey(iso))
            throw new Exception($"No EIC code for {iso}");

        var zones = ZoneCodes[iso];
        var totalBySource = new Dictionary<string, double>();

        foreach (var zone in zones)
        {
            var xml = await FetchZoneXml(zone);
            var zoneData = ParseZone(xml);
            foreach (var kv in zoneData)
            {
                if (!totalBySource.ContainsKey(kv.Key)) totalBySource[kv.Key] = 0;
                totalBySource[kv.Key] += kv.Value;
            }
        }

        var bySource = new List<SourceBreakdown>();
        foreach (var kv in totalBySource)
        {
            if (!SourceMap.ContainsKey(kv.Key)) continue;
            var (name, renewable) = SourceMap[kv.Key];
            bySource.Add(new SourceBreakdown
            {
                Source = name,
                Renewable = renewable,
                ValueMw = Math.Round(kv.Value, 1)
            });
        }

        var total = bySource.Sum(s => s.ValueMw);
        var renewableMw = bySource.Where(s => s.Renewable).Sum(s => s.ValueMw);
        var pct = total > 0 ? Math.Round(renewableMw / total * 100, 1) : 0;

        if (existing == null)
        {
            existing = new GenerationRecord { IsoCode = iso };
            db.GenerationRecords.Add(existing);
        }

        existing.CountryName = countryName;
        existing.FetchedAt = DateTime.UtcNow;
        existing.Total = Math.Round(total, 1);
        existing.RenewableMw = Math.Round(renewableMw, 1);
        existing.RenewablePct = pct;
        existing.BySourceJson = JsonSerializer.Serialize(bySource);
        existing.ZonesAggregatedJson = JsonSerializer.Serialize(zones.ToList());

        await db.SaveChangesAsync();
        return MapRecordToDto(existing);
    }

    private static CountryGeneration MapRecordToDto(GenerationRecord record)
    {
        var bySource = JsonSerializer.Deserialize<List<SourceBreakdown>>(record.BySourceJson)
                       ?? new List<SourceBreakdown>();
        var zones = JsonSerializer.Deserialize<List<string>>(record.ZonesAggregatedJson)
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

    private async Task<string> FetchZoneXml(string zoneCode)
    {
        var now = DateTime.UtcNow;
        var start = now.AddDays(-1).ToString("yyyyMMdd") + "0000";
        var end = now.AddDays(1).ToString("yyyyMMdd") + "0000";

        var url = "https://web-api.tp.entsoe.eu/api"
            + "?documentType=A75&processType=A16"
            + $"&in_Domain={zoneCode}"
            + $"&periodStart={start}&periodEnd={end}"
            + $"&securityToken={_apiKey}";

        return await _http.GetStringAsync(url);
    }

    private Dictionary<string, double> ParseZone(string xmlText)
    {
        var result = new Dictionary<string, double>();
        var doc = XDocument.Parse(xmlText);
        var ns = doc.Root!.Name.Namespace;

        foreach (var ts in doc.Descendants(ns + "TimeSeries"))
        {
            var psr = ts.Descendants(ns + "psrType").FirstOrDefault()?.Value;
            if (psr == null) continue;

            var points = ts.Descendants(ns + "Point").ToList();
            if (points.Count == 0) continue;

            var lastQty = points
                .Select(p => double.Parse(p.Element(ns + "quantity")!.Value, CultureInfo.InvariantCulture))
                .Last();

            if (!result.ContainsKey(psr)) result[psr] = 0;
            result[psr] += lastQty;
        }

        return result;
    }
}
