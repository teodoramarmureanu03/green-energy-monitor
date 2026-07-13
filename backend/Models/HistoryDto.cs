namespace backend.Models;

public class HistoryDto
{
    public string Date { get; set; } = string.Empty;
    public double Total { get; set; }
    public double RenewableMw { get; set; }
    public double RenewablePct { get; set; }
    public string BySourceJson { get; set; } = string.Empty;
}