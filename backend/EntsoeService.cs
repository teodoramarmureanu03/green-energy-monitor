using System.Xml.Linq;
using backend.Models;

namespace backend;

public class EntsoeService
{
    private readonly HttpClient _http = new();
    private readonly string _apiKey;

    public EntsoeService(string apiKey)
    {
        _apiKey = apiKey;
    }

    // Traducere cod sursă ENTSO-E -> nume + dacă e regenerabil
    private static readonly Dictionary<string, (string Name, bool Renewable)> SourceMap = new()
    {
        ["B01"] = ("Biomass", true),
        ["B02"] = ("Fossil brown coal", false),
        ["B04"] = ("Fossil gas", false),
        ["B05"] = ("Fossil hard coal", false),
        ["B06"] = ("Fossil oil", false),
        ["B10"] = ("Hydro pumped storage", true),
        ["B11"] = ("Hydro Run-of-River", true),
        ["B12"] = ("Hydro water reservoir", true),
        ["B14"] = ("Nuclear", false),
        ["B16"] = ("Solar", true),
        ["B17"] = ("Waste", false),
        ["B18"] = ("Wind offshore", true),
        ["B19"] = ("Wind onshore", true),
    };

    public async Task<CountryGeneration> GetGermanyAsync()
    {
        // ziua de ieri -> azi, în format yyyyMMddHHmm (UTC)
        var now = DateTime.UtcNow;
        var start = now.AddDays(-1).ToString("yyyyMMdd") + "0000";
        var end = now.ToString("yyyyMMdd") + "0000";

        var url = "https://web-api.tp.entsoe.eu/api"
            + "?documentType=A75&processType=A16"
            + "&in_Domain=10Y1001A1001A83F"   // codul EIC al Germaniei
            + $"&periodStart={start}&periodEnd={end}"
            + $"&securityToken={_apiKey}";

        var xmlText = await _http.GetStringAsync(url);
        return ParseXml(xmlText, "DE", "Germany");
    }

    private CountryGeneration ParseXml(string xmlText, string iso, string countryName)
    {
        var doc = XDocument.Parse(xmlText);
        // ENTSO-E folosește un "namespace" XML — îl luăm ca să găsim elementele
        var ns = doc.Root!.Name.Namespace;

        var bySource = new List<SourceBreakdown>();

        // pentru fiecare bloc TimeSeries (= o sursă)
        foreach (var ts in doc.Descendants(ns + "TimeSeries"))
        {
            var psr = ts.Descendants(ns + "psrType").FirstOrDefault()?.Value;
            if (psr == null || !SourceMap.ContainsKey(psr)) continue;

            // luăm ultima valoare (cea mai recentă oră)
            var points = ts.Descendants(ns + "Point").ToList();
            if (points.Count == 0) continue;

            var lastQty = points
                .Select(p => double.Parse(p.Element(ns + "quantity")!.Value))
                .Last();

            var (name, renewable) = SourceMap[psr];
            bySource.Add(new SourceBreakdown
            {
                Source = name,
                Renewable = renewable,
                ValueMw = lastQty
            });
        }

        var total = bySource.Sum(s => s.ValueMw);
        var renewableMw = bySource.Where(s => s.Renewable).Sum(s => s.ValueMw);
        var pct = total > 0 ? Math.Round(renewableMw / total * 100, 1) : 0;

        return new CountryGeneration
        {
            IsoCode = iso,
            Country = countryName,
            Timestamp = DateTime.UtcNow.ToString("o"),
            ZonesAggregated = new List<string> { "DE-LU" },
            Total = Math.Round(total, 1),
            RenewableMw = Math.Round(renewableMw, 1),
            RenewablePct = pct,
            BySource = bySource
        };
    }
}