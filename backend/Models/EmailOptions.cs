namespace backend.Models;

public class EmailOptions
{
    public const string SectionName = "Email";

    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromAddress { get; set; } = "noreply@green-energy-monitor.local";
    public string FromName { get; set; } = "Green Energy Monitor";
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";
}
