using backend.Models;
using backend;

var builder = WebApplication.CreateBuilder(args);

var apiKey = builder.Configuration["EntsoeApiKey"] ?? "";
var entsoe = new EntsoeService(apiKey);
// CORS — permite frontend-ului (Vite, pe portul 5173) să ne ceară date.
// Fără asta, browserul blochează cererile din frontend.
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

// Endpoint 1: lista țărilor (deocamdată câteva, hardcodate)
app.MapGet("/api/countries", () => new[]
{
    new CountryInfo { Id = "de", IsoCode = "DE", Name = "Germany" },
    new CountryInfo { Id = "ro", IsoCode = "RO", Name = "Romania" },
    new CountryInfo { Id = "fr", IsoCode = "FR", Name = "France" },
});

app.MapGet("/api/generation/{iso}", async (string iso) =>
{
    if (iso.ToUpper() == "DE")
    {
        return Results.Ok(await entsoe.GetGermanyAsync());
    }
    // restul țărilor — deocamdată date fixe (le adăugăm după)
    return Results.Ok(new CountryGeneration
    {
        IsoCode = iso.ToUpper(),
        Country = iso.ToUpper(),
        Total = 0,
        BySource = new()
    });
});



// Endpoint 2: datele unei țări (hardcodate, doar ca test de legătură)
/*app.MapGet("/api/generation/{iso}", (string iso) => new CountryGeneration
{
    IsoCode = iso.ToUpper(),
    Country = iso.ToUpper(),
    Timestamp = DateTime.UtcNow.ToString("o"),
    ZonesAggregated = new List<string> { iso.ToUpper() },
    Total = 10000,
    RenewableMw = 5000,
    RenewablePct = 50,
    BySource = new List<SourceBreakdown>
    {
        new() { Source = "Wind onshore", Renewable = true, ValueMw = 3000 },
        new() { Source = "Solar", Renewable = true, ValueMw = 2000 },
        new() { Source = "Nuclear", Renewable = false, ValueMw = 5000 },
    }
});*/

app.Run();