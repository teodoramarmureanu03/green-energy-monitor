namespace backend.Models;

public class HistoryRequest
{
    public string Iso { get; set; } = "";
    public string Period { get; set; } = "week";
    public string? TimeZone { get; set; }
}
