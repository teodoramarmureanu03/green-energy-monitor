using System.Xml.Linq;
using System.Globalization;
using backend.Models;

namespace backend;

public class EntsoeService
{
    private readonly HttpClient _http = new();
    private readonly string _apiKey;
    // cache în memorie: iso -> (date, momentul când au fost luate)
    private static readonly Dictionary<string, (CountryGeneration data, DateTime time)> _cache = new();
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(15);
    public EntsoeService(string apiKey)
    {
        _apiKey = apiKey;
    }

    // Traducere cod sursă ENTSO-E -> nume + dacă e regenerabil
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

    // Traducere cod ISO -> cod(uri) EIC ale zonelor. Țările multi-zonă au mai multe.
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
            "10Y1001A1001A73I", // IT-North
            "10Y1001A1001A70O", // IT-Centre-North
            "10Y1001A1001A71M", // IT-Centre-South
            "10Y1001A1001A788", // IT-South
            "10Y1001A1001A75E", // IT-Sicily
            "10Y1001A1001A74G", // IT-Sardinia
        },
        ["LT"] = new[] { "10YLT-1001A0008Q" },
        ["LV"] = new[] { "10YLV-1001A00074" },
        ["NL"] = new[] { "10YNL----------L" },
        ["NO"] = new[] {
            "10YNO-1--------2", // NO1
            "10YNO-2--------T", // NO2
            "10YNO-3--------J", // NO3
            "10YNO-4--------9", // NO4
            "10Y1001A1001A48H", // NO5
        },
        ["PL"] = new[] { "10YPL-AREA-----S" },
        ["PT"] = new[] { "10YPT-REN------W" },
        ["RO"] = new[] { "10YRO-TEL------P" },
        ["SE"] = new[] {
            "10Y1001A1001A44P", // SE1
            "10Y1001A1001A45N", // SE2
            "10Y1001A1001A46L", // SE3
            "10Y1001A1001A47J", // SE4
        },
        ["SI"] = new[] { "10YSI-ELES-----O" },
        ["SK"] = new[] { "10YSK-SEPS-----K" },
    };

    // Metodă generală — pentru orice țară
    public async Task<CountryGeneration> GetGenerationAsync(string iso, string countryName)
{
    iso = iso.ToUpper();

    // MODIFICARE 1: verificăm cache-ul întâi. Dacă avem date recente, le folosim.
    if (_cache.ContainsKey(iso))
    {
        var cached = _cache[iso];
        if (DateTime.UtcNow - cached.time < CacheDuration)
            return cached.data;
    }

    if (!ZoneCodes.ContainsKey(iso))
        throw new Exception($"Nu am cod EIC pentru {iso}");

    var zones = ZoneCodes[iso];

    // adunăm producția pe surse din TOATE zonele țării
    var totalBySource = new Dictionary<string, double>();

    foreach (var zone in zones)
    {
        var xml = await FetchZoneXml(zone);
        var zoneData = ParseZone(xml);
        // adunăm în totalBySource
        foreach (var kv in zoneData)
        {
            if (!totalBySource.ContainsKey(kv.Key))
                totalBySource[kv.Key] = 0;
            totalBySource[kv.Key] += kv.Value;
        }
    }

    // construim lista bySource
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

    // MODIFICARE 2: punem rezultatul într-o variabilă (în loc de return direct)
    var result = new CountryGeneration
    {
        IsoCode = iso,
        Country = countryName,
        Timestamp = DateTime.UtcNow.ToString("o"),
        ZonesAggregated = zones.ToList(),
        Total = Math.Round(total, 1),
        RenewableMw = Math.Round(renewableMw, 1),
        RenewablePct = pct,
        BySource = bySource
    };

    // MODIFICARE 3: salvăm în cache înainte de return
    _cache[iso] = (result, DateTime.UtcNow);
    return result;
}

    // cere XML-ul pentru o zonă
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

    // parsează un XML de zonă -> dicționar cod sursă -> ultima valoare
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

            if (!result.ContainsKey(psr))
                result[psr] = 0;
            result[psr] += lastQty;
        }

        return result;
    }
}