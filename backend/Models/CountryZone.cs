using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class CountryZone
{
    [Key]
    public int Id { get; set; }
    public string IsoCode { get; set; } = "";
    public string ZoneCode { get; set; } = "";
}
