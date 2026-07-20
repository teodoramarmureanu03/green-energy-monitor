namespace backend.Models;

public class HistoryDto
{
    public string Date { get; set; } = string.Empty;
    public double Total { get; set; }
    public double RenewableMw { get; set; }
    public double RenewablePct { get; set; }

    // The frontend (GenerationHistoryApiPoint) reads windMw/solarMw directly,
    // not a JSON blob with every source.
    public double WindMw { get; set; }
    public double SolarMw { get; set; }
}