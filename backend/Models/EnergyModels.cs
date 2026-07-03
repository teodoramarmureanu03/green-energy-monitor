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
public class GenerationRecord
{
    public int Id { get; set; }
    public string IsoCode { get; set; } = "";
    public string CountryName { get; set; } = "";
    public DateTime FetchedAt { get; set; }
    public double Total { get; set; }
    public double RenewableMw { get; set; }
    public double RenewablePct { get; set; }
    // Stored as JSON string — EF Core reads/writes this as text
    public string BySourceJson { get; set; } = "[]";
    public string ZonesAggregatedJson { get; set; } = "[]";
}
