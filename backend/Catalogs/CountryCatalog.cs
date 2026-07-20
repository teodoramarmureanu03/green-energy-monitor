namespace backend;

/// <summary>
/// Canonical list of countries the application supports for sync and validation.
/// Zone codes are also seeded into the CountryZones table on startup.
/// </summary>
public static class CountryCatalog
{
    private static readonly Dictionary<string, string> Names = new(StringComparer.OrdinalIgnoreCase)
    {
        ["AT"] = "Austria",
        ["BE"] = "Belgium",
        ["BG"] = "Bulgaria",
        ["CH"] = "Switzerland",
        ["CZ"] = "Czechia",
        ["DE"] = "Germany",
        ["DK"] = "Denmark",
        ["EE"] = "Estonia",
        ["ES"] = "Spain",
        ["FI"] = "Finland",
        ["FR"] = "France",
        ["GR"] = "Greece",
        ["HR"] = "Croatia",
        ["HU"] = "Hungary",
        ["IE"] = "Ireland",
        ["IT"] = "Italy",
        ["LT"] = "Lithuania",
        ["LV"] = "Latvia",
        ["NL"] = "Netherlands",
        ["NO"] = "Norway",
        ["PL"] = "Poland",
        ["PT"] = "Portugal",
        ["RO"] = "Romania",
        ["SE"] = "Sweden",
        ["SI"] = "Slovenia",
        ["SK"] = "Slovakia",
    };

    /// <summary>
    /// ENTSO-E bidding-zone / control-area codes used for generation queries.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, string[]> ZoneCodes =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["AT"] = ["10YAT-APG------L"],
            ["BE"] = ["10YBE----------2"],
            ["BG"] = ["10YCA-BULGARIA-R"],
            ["CH"] = ["10YCH-SWISSGRIDZ"],
            ["CZ"] = ["10YCZ-CEPS-----N"],
            ["DE"] = ["10Y1001A1001A83F"],
            ["DK"] = ["10YDK-1--------W", "10YDK-2--------M"],
            ["EE"] = ["10Y1001A1001A39I"],
            ["ES"] = ["10YES-REE------0"],
            ["FI"] = ["10YFI-1--------U"],
            ["FR"] = ["10YFR-RTE------C"],
            ["GR"] = ["10YGR-HTSO-----Y"],
            ["HR"] = ["10YHR-HEP------M"],
            ["HU"] = ["10YHU-MAVIR----U"],
            ["IE"] = ["10Y1001A1001A59C"],
            ["IT"] =
            [
                "10Y1001A1001A73I",
                "10Y1001A1001A70O",
                "10Y1001A1001A71M",
                "10Y1001A1001A788",
                "10Y1001A1001A75E",
                "10Y1001A1001A74G",
            ],
            ["LT"] = ["10YLT-1001A0008Q"],
            ["LV"] = ["10YLV-1001A00074"],
            ["NL"] = ["10YNL----------L"],
            ["NO"] =
            [
                "10YNO-1--------2",
                "10YNO-2--------T",
                "10YNO-3--------J",
                "10YNO-4--------9",
                "10Y1001A1001A48H",
            ],
            ["PL"] = ["10YPL-AREA-----S"],
            ["PT"] = ["10YPT-REN------W"],
            ["RO"] = ["10YRO-TEL------P"],
            ["SE"] =
            [
                "10Y1001A1001A44P",
                "10Y1001A1001A45N",
                "10Y1001A1001A46L",
                "10Y1001A1001A47J",
            ],
            ["SI"] = ["10YSI-ELES-----O"],
            ["SK"] = ["10YSK-SEPS-----K"],
        };

    public static readonly IReadOnlyDictionary<string, (string Name, bool Renewable)> EnergySources =
        new Dictionary<string, (string Name, bool Renewable)>(StringComparer.OrdinalIgnoreCase)
        {
            ["B01"] = ("Biomass", true),
            ["B02"] = ("Fossil brown coal", false),
            ["B03"] = ("Fossil coal-derived gas", false),
            ["B04"] = ("Fossil gas", false),
            ["B05"] = ("Fossil hard coal", false),
            ["B06"] = ("Fossil oil", false),
            ["B09"] = ("Geothermal", true),
            ["B10"] = ("Hydro pumped storage", false),
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

    public static IReadOnlyDictionary<string, string> All => Names;

    public static bool IsKnown(string iso) =>
        Names.ContainsKey(iso);

    public static string GetDisplayName(string iso) =>
        Names.TryGetValue(iso.ToUpperInvariant(), out var name)
            ? name
            : iso.ToUpperInvariant();
}
