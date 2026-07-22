using backend;
using backend.Repositories;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<EnergyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IGenerationRepository, GenerationRepository>();
builder.Services.AddScoped<IHistoryRepository, HistoryRepository>();
builder.Services.AddScoped<GenerationService>();
builder.Services.AddScoped<HistoryService>();
builder.Services.AddHttpClient<EntsoeService>();
builder.Services.AddHostedService<EntsoeDataSyncService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermiteTot", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors("PermiteTot");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EnergyDbContext>();

    try
    {
        await db.Database.MigrateAsync();
    }
    catch (PostgresException ex) when (ex.SqlState is "42701" or "42P07")
    {
        // Handles databases where schema objects were created manually before migrations ran.
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ({"20260713131344_AddSnapshotFieldsAndChartPoints"}, {"9.0.4"})
            ON CONFLICT ("MigrationId") DO NOTHING
            """);
    }

    await EnsureReferenceDataAsync(db);
}

app.MapControllers();
app.Run();

static async Task EnsureReferenceDataAsync(EnergyDbContext db)
{
    var existingZones = await db.CountryZones
        .Select(zone => new { zone.IsoCode, zone.ZoneCode })
        .ToListAsync();

    var existingZoneKeys = existingZones
        .Select(zone => (zone.IsoCode.ToUpperInvariant(), zone.ZoneCode))
        .ToHashSet();

    foreach (var (iso, zoneCodes) in CountryCatalog.ZoneCodes)
    {
        foreach (var zoneCode in zoneCodes)
        {
            if (existingZoneKeys.Contains((iso, zoneCode)))
            {
                continue;
            }

            db.CountryZones.Add(new backend.Models.CountryZone
            {
                IsoCode = iso,
                ZoneCode = zoneCode,
            });
        }
    }

    var existingSourceCodes = await db.EnergySources
        .Select(source => source.Code)
        .ToListAsync();

    var existingSourceSet = existingSourceCodes
        .Select(code => code.ToUpperInvariant())
        .ToHashSet();

    foreach (var (code, source) in CountryCatalog.EnergySources)
    {
        if (existingSourceSet.Contains(code.ToUpperInvariant()))
        {
            continue;
        }

        db.EnergySources.Add(new backend.Models.EnergySource
        {
            Code = code,
            Name = source.Name,
            IsRenewable = source.Renewable,
        });
    }

    if (db.ChangeTracker.HasChanges())
    {
        await db.SaveChangesAsync();
    }
}
