using backend.Models;
using backend;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()));

builder.Services.AddDbContext<EnergyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var apiKey = builder.Configuration["EntsoeApiKey"] ?? "";

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EnergyDbContext>();
    db.Database.Migrate();
}

var entsoe = new EntsoeService(apiKey, app.Services.GetRequiredService<IServiceScopeFactory>());

app.UseCors();

var countryNames = new Dictionary<string, string>
{
    ["AT"] = "Austria",     ["BE"] = "Belgium",     ["BG"] = "Bulgaria",
    ["CH"] = "Switzerland", ["CZ"] = "Czechia",     ["DE"] = "Germany",
    ["DK"] = "Denmark",     ["EE"] = "Estonia",     ["ES"] = "Spain",
    ["FI"] = "Finland",     ["FR"] = "France",      ["GR"] = "Greece",
    ["HR"] = "Croatia",     ["HU"] = "Hungary",     ["IE"] = "Ireland",
    ["IT"] = "Italy",       ["LT"] = "Lithuania",   ["LV"] = "Latvia",
    ["NL"] = "Netherlands", ["NO"] = "Norway",      ["PL"] = "Poland",
    ["PT"] = "Portugal",    ["RO"] = "Romania",     ["SE"] = "Sweden",
    ["SI"] = "Slovenia",    ["SK"] = "Slovakia",
};

app.MapGet("/api/countries", () =>
    countryNames.Select(kv => new CountryInfo
    {
        Id = kv.Key.ToLower(),
        IsoCode = kv.Key,
        Name = kv.Value
    }));

// Always reads from DB — instant response, never blocks on API call
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

// Startup warm-up: populate DB for any country not yet stored
_ = Task.Run(async () =>
{
    await Task.Delay(3000);
    Console.WriteLine("Starting startup warm-up...");
    foreach (var kv in countryNames)
    {
        try
        {
            await entsoe.GetGenerationAsync(kv.Key, kv.Value);
            Console.WriteLine($"Warm-up: {kv.Key}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warm-up error {kv.Key}: {ex.Message}");
        }
        await Task.Delay(2000);
    }
    Console.WriteLine("Warm-up complete.");
});

// Scheduled refresh: every 15 minutes, fetch ALL countries from ENTSO-E
// and update the DB in the background. The frontend is never affected —
// it always reads the previous data from the DB until the refresh is done.
_ = Task.Run(async () =>
{
    while (true)
    {
        await Task.Delay(TimeSpan.FromMinutes(15));
        Console.WriteLine("Starting 15-minute scheduled refresh...");

        foreach (var kv in countryNames)
        {
            try
            {
                using var scope = app.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<EnergyDbContext>();
                var existing = await db.GenerationRecords
                    .FirstOrDefaultAsync(r => r.IsoCode == kv.Key);
                await entsoe.FetchAndSaveAsync(kv.Key, kv.Value, db, existing);
                Console.WriteLine($"Refreshed: {kv.Key}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Refresh error {kv.Key}: {ex.Message}");
            }
            await Task.Delay(2000);
        }

        Console.WriteLine("Scheduled refresh complete.");
    }
});

app.Run();
