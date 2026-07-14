namespace backend.Models;

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
