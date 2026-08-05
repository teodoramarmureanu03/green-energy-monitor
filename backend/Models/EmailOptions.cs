namespace backend.Models;

public class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>Mailjet API key (public) — preferred on Render (HTTPS, not blocked SMTP).</summary>
    public string MailjetApiKey { get; set; } = "";

    /// <summary>Mailjet secret key (private).</summary>
    public string MailjetSecretKey { get; set; } = "";

    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromAddress { get; set; } = "";
    public string FromName { get; set; } = "Green Energy Monitor";
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";

    public bool HasMailjet =>
        !LooksLikePlaceholder(MailjetApiKey)
        && !LooksLikePlaceholder(MailjetSecretKey)
        && !LooksLikePlaceholder(FromAddress)
        && MailjetApiKey.Trim().Length >= 10
        && MailjetSecretKey.Trim().Length >= 10;

    public bool HasSmtp =>
        !string.IsNullOrWhiteSpace(Host)
        && !LooksLikePlaceholder(Username)
        && !LooksLikePlaceholder(Password)
        && !LooksLikePlaceholder(FromAddress);

    /// <summary>True when Mailjet or SMTP credentials are present.</summary>
    public bool IsConfigured => HasMailjet || HasSmtp;

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
            || normalized.Contains("your-mailjet")
            || normalized.Contains("your-brevo-api-key")
            || normalized.Contains("xkeysib-xxxxxxxx")
            || normalized.Contains("example.com")
            || normalized.Contains("onboarding@resend.dev");
    }
}
