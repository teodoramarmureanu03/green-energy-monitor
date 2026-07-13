using backend;
using backend.Models;
using backend.Repositories;
using backend.Services;
using Microsoft.EntityFrameworkCore;

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
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<EnergyDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "DefaultConnection"
        )
    );
});

builder.Services.AddHttpClient<EntsoeService>();
builder.Services.AddScoped<GenerationService>();
builder.Services.AddScoped<IGenerationRepository, GenerationRepository>();
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
    var db = scope.ServiceProvider
        .GetRequiredService<EnergyDbContext>();

    await DatabaseSchemaBootstrap.EnsureAsync(db);
    db.Database.Migrate();
}

app.MapControllers();

app.Run();
