using backend.Models;
using backend;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()));

builder.Services.AddDbContext<EnergyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var apiKey = builder.Configuration["EntsoeApiKey"] ?? "";

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();

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

// Ruta originală - întoarce mereu doar starea curentă a țării
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

app.MapGet("/api/countries", () =>
    countryNames.Select(kv => new CountryInfo
    {
        Id = kv.Key.ToLower(),
        IsoCode = kv.Key,
        Name = kv.Value
    }));

// Always reads from DB — instant response, never blocks on API call
// --- COD NOU: Endpoint pentru Istoric (Săptămână, Lună, An) ---
app.MapGet("/api/generation/history/{iso}", async (string iso, string? period, EnergyDbContext db) =>
{
    iso = iso.ToUpper();
    DateTime timeLimit = DateTime.UtcNow.AddDays(-7); // Default: 1 săptămână
    string p = string.IsNullOrEmpty(period) ? "week" : period.ToLower();

    if (p == "month") timeLimit = DateTime.UtcNow.AddDays(-30);
    else if (p == "year") timeLimit = DateTime.UtcNow.AddDays(-365);

    var rawHistory = await db.GenerationRecords
        .Where(r => r.IsoCode == iso && r.FetchedAt >= timeLimit)
        .OrderBy(r => r.FetchedAt)
        .ToListAsync();

    // Dacă utilizatorul vrea o săptămână, putem trimite datele mai detaliat (la 15 min / o oră)
    // Dacă vrea o lună sau un an, le grupăm pe ZILE ca să nu blocăm graficul
    // Dacă utilizatorul vrea o lună sau un an, calculăm MEDIA MATEMATICĂ a zilei
    if (p == "month" || p == "year")
    {
        var dailyHistory = rawHistory
            .GroupBy(r => r.FetchedAt.Date) // Grupăm toate cele ~96 de citiri dintr-o zi
            .Select(g => {
                // Luăm ultima înregistrare doar ca să îi furăm structura de "BySourceJson" (proporțiile)
                var latestRecord = g.OrderByDescending(r => r.FetchedAt).First();
                
                return new {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    // AICI SE ÎNTÂMPLĂ MAGIA: Calculăm mediile și le rotunjim la o zecimală
                    Total = Math.Round(g.Average(r => r.Total), 1),
                    RenewableMw = Math.Round(g.Average(r => r.RenewableMw), 1),
                    RenewablePct = Math.Round(g.Average(r => r.RenewablePct), 1),
                    BySourceJson = latestRecord.BySourceJson 
                };
            }).ToList();
        
        return Results.Ok(dailyHistory);
    }
    
    // Pentru săptămână trimitem formatul brut cu ora exactă
    var weeklyHistory = rawHistory.Select(r => new {
        Date = r.FetchedAt.ToString("yyyy-MM-dd HH:mm"),
        r.Total,
        r.RenewableMw,
        r.RenewablePct,
        r.BySourceJson
    }).ToList();

    return Results.Ok(weeklyHistory);
});

// Ruta de Backfill (Mașina Timpului)
// Ruta de Backfill (Mașina Timpului)
app.MapGet("/api/backfill/{iso}", async (string iso, int days, EnergyDbContext db) =>
{
    iso = iso.ToUpper();
    if (!countryNames.ContainsKey(iso))
        return Results.NotFound($"Țara {iso} nu există.");

    // Limităm la un an maxim per apel pentru siguranță
    if (days > 365) days = 365;

    // Așteptăm să termine procesul de descărcare
    await entsoe.BackfillHistoryAsync(iso, countryNames[iso], db, days);
    
    return Results.Ok($"Succes! S-au generat datele pe ultimele {days} zile pentru {iso}.");
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
        Console.WriteLine("Starting 15-minute scheduled refresh...");

        foreach (var kv in countryNames)
        {
            try
            {
             // --- COD MODIFICAT: Apelăm funcția curat, fără să mai căutăm rândul existent ---
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<EnergyDbContext>();

// Apelăm metoda de Fetch direct. Ea se va ocupa de crearea și salvarea noului rând.
await entsoe.FetchAndSaveAsync(kv.Key, kv.Value, db, null);
Console.WriteLine($"Refreshed: {kv.Key}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Refresh error {kv.Key}: {ex.Message}");
            }
            await Task.Delay(2000);
        }

        Console.WriteLine("Scheduled refresh complete.");
        await Task.Delay(TimeSpan.FromMinutes(15));
    }
});

app.Run();
