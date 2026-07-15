namespace backend;

/// <summary>
/// Canonical list of countries the application supports for sync and validation.
/// ENTSO-E zone codes themselves are stored in the database (CountryZones table).
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

    public static IReadOnlyDictionary<string, string> All => Names;

    public static bool IsKnown(string iso) =>
        Names.ContainsKey(iso);

    public static string GetDisplayName(string iso) =>
        Names.TryGetValue(iso.ToUpperInvariant(), out var name)
            ? name
            : iso.ToUpperInvariant();
}
