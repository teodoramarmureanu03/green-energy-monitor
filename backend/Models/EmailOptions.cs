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

    /// <summary>
    /// True when real SMTP credentials are present (host-only secrets, never commit them).
    /// </summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Host)
        && !LooksLikePlaceholder(Username)
        && !LooksLikePlaceholder(Password)
        && !LooksLikePlaceholder(FromAddress);

    private static bool LooksLikePlaceholder(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        var normalized = value.Trim().ToLowerInvariant();
        return normalized.Contains("your_real_gmail")
            || normalized.Contains("your@gmail.com")
            || normalized.Contains("your_16_char_app_password")
            || normalized.Contains("your_app_password")
            || normalized.Contains("app.sender@gmail.com")
            || normalized.Contains("xxxx xxxx")
            || normalized.Contains("example.com");
    }
}
