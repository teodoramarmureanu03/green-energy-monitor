using backend.Models;
using backend;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// CORS — allow frontend (Vite on 5173)
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()));

// Register PostgreSQL DbContext via EF Core
builder.Services.AddDbContext<EnergyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var apiKey = builder.Configuration["EntsoeApiKey"] ?? "";

var app = builder.Build();

// Run EF Core migrations automatically on startup — creates tables if they don't exist
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EnergyDbContext>();
    db.Database.Migrate();
}

// Create EntsoeService with access to the DI scope factory (needed to get DbContext in background tasks)
var entsoe = new EntsoeService(apiKey, app.Services.GetRequiredService<IServiceScopeFactory>());

app.UseCors();

// Country list
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

// Endpoint 1: list of countries
app.MapGet("/api/countries", () =>
    countryNames.Select(kv => new CountryInfo
    {
        Id = kv.Key.ToLower(),
        IsoCode = kv.Key,
        Name = kv.Value
    }));

// Endpoint 2: generation data for a country — reads from DB, fetches from ENTSO-E only if stale
app.MapGet("/api/generation/{iso}", async (string iso) =>
{
    iso = iso.ToUpper();
    if (!countryNames.ContainsKey(iso))
        return Results.NotFound($"Unknown country: {iso}");

    try
    {
        var data = await entsoe.GetGenerationAsync(iso, countryNames[iso]);
        return Results.Ok(data);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error for {iso}: {ex.Message}");
    }
});

// Background cache warm-up: fetch all countries on startup with 2s delay between each
// Data is saved to PostgreSQL so it survives restarts
_ = Task.Run(async () =>
{
    // Wait a few seconds for the app to fully start
    await Task.Delay(3000);

    foreach (var kv in countryNames)
    {
        try
        {
            await entsoe.GetGenerationAsync(kv.Key, kv.Value);
            Console.WriteLine($"Cached: {kv.Key}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error for {kv.Key}: {ex.Message}");
        }
        await Task.Delay(2000);
    }
    Console.WriteLine("All countries cached in PostgreSQL.");
});

// Background refresh: re-fetch all countries every 15 minutes
_ = Task.Run(async () =>
{
    while (true)
    {
        await Task.Delay(TimeSpan.FromMinutes(15));
        Console.WriteLine("Starting 15-minute refresh...");

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EnergyDbContext>();

        foreach (var kv in countryNames)
        {
            try
            {
                var existing = await db.GenerationRecords
                    .FirstOrDefaultAsync(r => r.IsoCode == kv.Key);
                await entsoe.FetchAndSaveAsync(kv.Key, kv.Value, db, existing);
                Console.WriteLine($"Refreshed: {kv.Key}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Refresh error for {kv.Key}: {ex.Message}");
            }
            await Task.Delay(2000);
        }
        Console.WriteLine("15-minute refresh complete.");
    }
});

app.Run();
