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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");

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
}

app.MapControllers();
app.Run();
