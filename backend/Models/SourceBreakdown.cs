namespace backend.Models;

public class SourceBreakdown
{
    public string Source { get; set; } = "";
    public bool Renewable { get; set; }
    public double ValueMw { get; set; }
}
