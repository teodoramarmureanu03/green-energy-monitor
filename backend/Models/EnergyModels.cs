using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Models;

// ---- API response models (same shape as before, mirroring contract.ts) ----

public class SourceBreakdown
{
    public string Source { get; set; } = "";
    public bool Renewable { get; set; }
    public double ValueMw { get; set; }
}

public class CountryGeneration
{
    public string IsoCode { get; set; } = "";
    public string Country { get; set; } = "";
    public string Timestamp { get; set; } = "";
    public List<string> ZonesAggregated { get; set; } = new();
    public double Total { get; set; }
    public double RenewableMw { get; set; }
    public double RenewablePct { get; set; }
    public List<SourceBreakdown> BySource { get; set; } = new();
}

public class CountryInfo
{
    public string Id { get; set; } = "";
    public string IsoCode { get; set; } = "";
    public string Name { get; set; } = "";
}


// ---- EF Core database entities ----

// Stores the latest generation snapshot per country
// Stores the latest generation snapshot per country
public class GenerationRecord
{
    public int Id { get; set; }
    
    // Câmpurile noi pentru logica directă cu tabelele din PostgreSQL (ENTSO-E)
    public string CountryIso { get; set; } = string.Empty;
    public string ZoneCode { get; set; } = string.Empty;
    public string EnergySourceCode { get; set; } = string.Empty;
    public string EnergySourceName { get; set; } = string.Empty;
    public bool IsRenewable { get; set; }
    public double ValueMw { get; set; }
    public DateTime Timestamp { get; set; }

    // Câmpurile vechi restaurate pentru Repository și Service
    public string IsoCode { get; set; } = string.Empty;
    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;

    // ULTIMELE CÂMPURI REPARATE: Cele cerute acum de GenerationService.cs
    public string BySourceJson { get; set; } = string.Empty;
    public double Total { get; set; }
    public double RenewableMw { get; set; }
    public double RenewablePct { get; set; }
}

// Tabelul pentru Sursele de Energie (Biomasă, Solar, etc.)
public class EnergySource
{
    [Key] // Codul "B01", "B02" va fi cheia primară
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsRenewable { get; set; }
}

// Tabelul pentru Zonele Țărilor
public class CountryZone
{
    [Key]
    public int Id { get; set; } // ID generat automat
    public string IsoCode { get; set; } = ""; // "RO", "AT"
    public string ZoneCode { get; set; } = ""; // "10YRO-TEL------P"
}