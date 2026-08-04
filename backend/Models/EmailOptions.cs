namespace backend.Models;

public class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>Resend API key (preferred on Render — uses HTTPS, not blocked SMTP ports).</summary>
    public string ResendApiKey { get; set; } = "";

    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromAddress { get; set; } = "onboarding@resend.dev";
    public string FromName { get; set; } = "Green Energy Monitor";
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";

    public bool HasResend => !LooksLikePlaceholder(ResendApiKey) && ResendApiKey.StartsWith("re_", StringComparison.Ordinal);

    public bool HasSmtp =>
        !string.IsNullOrWhiteSpace(Host)
        && !LooksLikePlaceholder(Username)
        && !LooksLikePlaceholder(Password)
        && !LooksLikePlaceholder(FromAddress);

    /// <summary>True when Resend or SMTP credentials are present.</summary>
    public bool IsConfigured => HasResend || HasSmtp;

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
            || normalized.Contains("re_xxxxxxxxx")
            || normalized.Contains("example.com");
    }
}
