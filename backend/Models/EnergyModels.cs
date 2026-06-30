namespace backend.Models;

// Oglinda lui contract.ts din frontend — exact aceeași formă a datelor.
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