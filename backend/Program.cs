
using backend;
using backend.Models;
using backend.Repositories;
using backend.Services;
using Microsoft.EntityFrameworkCore;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. SETĂRI DE BAZĂ (ROUTING, SWAGGER, CORS)
// ==========================================
builder.Services.AddControllers(); 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ==========================================
// 2. CONECTAREA LA BAZA DE DATE
// ==========================================
builder.Services.AddDbContext<EnergyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ==========================================
// 3. ANGAJAREA ECHIPEI (DEPENDENCY INJECTION)
// ==========================================
// Înregistrăm HttpClient (necesar pentru ca EntsoeService să poată descărca date de pe internet)
builder.Services.AddHttpClient<EntsoeService>();

builder.Services.AddScoped<IGenerationRepository, GenerationRepository>();
builder.Services.AddScoped<IGenerationService, GenerationService>();

builder.Services.AddScoped<EntsoeService>();

var app = builder.Build();

// ==========================================
// 4. REGULILE CASEI (MIDDLEWARE)
// ==========================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");

// ==========================================
// 5. PORNIREA RUTELOR
// ==========================================
app.MapControllers(); 

app.Run();