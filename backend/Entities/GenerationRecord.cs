namespace backend.Models;

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
