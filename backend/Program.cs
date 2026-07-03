using backend.Models;
using backend;
var builder = WebApplication.CreateBuilder(args);

// CORS — permite frontend-ului (Vite pe 5173) să ceară date
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()));

// citim cheia ENTSO-E și cream serviciul
var apiKey = builder.Configuration["EntsoeApiKey"] ?? "";
var entsoe = new EntsoeService(apiKey);

// dicționar iso -> nume (pentru toate țările)
var countryNames = new Dictionary<string, string>
{
    ["AT"] = "Austria", ["BE"] = "Belgium", ["BG"] = "Bulgaria",
    ["CH"] = "Switzerland", ["CZ"] = "Czechia", ["DE"] = "Germany",
    ["DK"] = "Denmark", ["EE"] = "Estonia", ["ES"] = "Spain",
    ["FI"] = "Finland", ["FR"] = "France", ["GR"] = "Greece",
    ["HR"] = "Croatia", ["HU"] = "Hungary", ["IE"] = "Ireland",
    ["IT"] = "Italy", ["LT"] = "Lithuania", ["LV"] = "Latvia",
    ["NL"] = "Netherlands", ["NO"] = "Norway", ["PL"] = "Poland",
    ["PT"] = "Portugal", ["RO"] = "Romania", ["SE"] = "Sweden",
    ["SI"] = "Slovenia", ["SK"] = "Slovakia",
};

var app = builder.Build();
app.UseCors();

// Endpoint 1: lista tuturor țărilor
app.MapGet("/api/countries", () =>
    countryNames.Select(kv => new CountryInfo
    {
        Id = kv.Key.ToLower(),
        IsoCode = kv.Key,
        Name = kv.Value
    }));

// Endpoint 2: datele de generație pentru o țară
app.MapGet("/api/generation/{iso}", async (string iso) =>
{
    iso = iso.ToUpper();
    if (!countryNames.ContainsKey(iso))
        return Results.NotFound($"Țară necunoscută: {iso}");

    try
    {
        var data = await entsoe.GetGenerationAsync(iso, countryNames[iso]);
        return Results.Ok(data);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Eroare pentru {iso}: {ex.Message}");
    }
});

// La pornire, încălzim cache-ul: cerem fiecare țară cu pauză, ca să nu ne banăm.
// Rulează în fundal, nu blochează pornirea serverului.
// La pornire, umplem cache-ul cu pauze, ca sa nu suprasolicitam ENTSO-E.
_ = Task.Run(async () =>
{
    foreach (var kv in countryNames)
    {
        try
        {
            await entsoe.GetGenerationAsync(kv.Key, kv.Value);
            Console.WriteLine($"Cache incarcat: {kv.Key}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Eroare la {kv.Key}: {ex.Message}");
        }
        await Task.Delay(2000); // pauza de 2 secunde intre tari
    }
    Console.WriteLine("Cache complet incarcat!");
});

app.Run();