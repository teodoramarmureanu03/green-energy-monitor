using System.ComponentModel.DataAnnotations;

namespace backend.Models;

// ---- API response models ----

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

// Aggregated live snapshot per country (written by background sync)
public class GenerationRecord
{
    public int Id { get; set; }

    public string IsoCode { get; set; } = "";
    public string CountryName { get; set; } = "";
    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
    public double Total { get; set; }
    public double RenewableMw { get; set; }
    public double RenewablePct { get; set; }
    public string BySourceJson { get; set; } = "[]";
    public string ZonesAggregatedJson { get; set; } = "[]";

    // Legacy per-source columns kept for existing DB schema compatibility
    public string CountryIso { get; set; } = "";
    public string ZoneCode { get; set; } = "";
    public string EnergySourceCode { get; set; } = "";
    public string EnergySourceName { get; set; } = "";
    public bool IsRenewable { get; set; }
    public double ValueMw { get; set; }
    public DateTime Timestamp { get; set; }
}

// Pre-aggregated chart history (Day / Week / Month)
public class GenerationChartPoint
{
    public int Id { get; set; }
    public string IsoCode { get; set; } = "";
    public string CountryName { get; set; } = "";
    public string PeriodType { get; set; } = "";
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public double Total { get; set; }
    public double RenewableMw { get; set; }
    public double RenewablePct { get; set; }
    public double WindMw { get; set; }
    public double SolarMw { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class EnergySource
{
    [Key]
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsRenewable { get; set; }
}

public class CountryZone
{
    [Key]
    public int Id { get; set; }
    public string IsoCode { get; set; } = "";
    public string ZoneCode { get; set; } = "";
}
