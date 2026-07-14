namespace backend.Models;

public class HistoryDto
{
    public string Date { get; set; } = string.Empty;
    public double Total { get; set; }
    public double RenewableMw { get; set; }
    public double RenewablePct { get; set; }

    // Frontend-ul (GenerationHistoryApiPoint) citește direct windMw/solarMw,
    // nu un blob JSON cu toate sursele.
    public double WindMw { get; set; }
    public double SolarMw { get; set; }
}