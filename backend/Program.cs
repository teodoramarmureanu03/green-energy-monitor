using backend;
using backend.Models; // (Sau unde ai tu EnergyDbContext)
using backend.Repositories;
using backend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. SETĂRI DE BAZĂ (ROUTING, SWAGGER, CORS)
// ==========================================

// Spunem aplicației să citească fișierele din folderul Controllers
builder.Services.AddControllers(); 

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Setăm CORS pentru a permite React-ului să citească datele
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
// Aici legăm interfețele de implementările lor
builder.Services.AddScoped<IGenerationRepository, GenerationRepository>();
builder.Services.AddScoped<IGenerationService, GenerationService>();

// (Dacă ai și un serviciu pentru ENTSO-E, îl pui tot aici)
// builder.Services.AddScoped<EntsoeService>();


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
// 5. PORNIREA RÚTELOR
// ==========================================
// Această comandă activează automat orice fișier cu [ApiController] din folderul Controllers
app.MapControllers(); 

app.Run();