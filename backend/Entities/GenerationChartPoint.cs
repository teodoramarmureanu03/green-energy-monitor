namespace backend.Models;

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
