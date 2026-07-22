namespace backend.Models;

public class ViewerTimezoneResponse
{
    public string ClientId { get; set; } = "";
    public string CountryIso { get; set; } = "";
    public string TimeZone { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}
