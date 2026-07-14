using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class EnergySource
{
    [Key]
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsRenewable { get; set; }
}
