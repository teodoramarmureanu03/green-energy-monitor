namespace backend.Models;

public class ViewerTimezoneRequest
{
    public string ClientId { get; set; } = "";
    public string CountryIso { get; set; } = "";
    public string TimeZone { get; set; } = "";
}
