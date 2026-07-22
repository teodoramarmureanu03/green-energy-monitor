using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Stores each browser client's selected viewing country / IANA timezone.
/// </summary>
public class ViewerTimezonePreference
{
    [Key]
    public int Id { get; set; }

    public string ClientId { get; set; } = "";

    public string CountryIso { get; set; } = "";

    public string TimeZone { get; set; } = "";

    public DateTime UpdatedAt { get; set; }
}
