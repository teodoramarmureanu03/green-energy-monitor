using backend.Models;
using backend.Services;

namespace backend;

public static class EmailExtensions
{
    public static IServiceCollection AddAppEmail(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient("mailjet");
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));

        // Allow MAILJET_* / SMTP_* / FRONTEND_BASE_URL names as docker-compose /.env on Render.
        services.PostConfigure<EmailOptions>(options =>
        {
            static string? Env(string key) => Environment.GetEnvironmentVariable(key);

            var mailjetKey = Env("MAILJET_API_KEY") ?? Env("Email__MailjetApiKey");
            if (!string.IsNullOrWhiteSpace(mailjetKey))
            {
                options.MailjetApiKey = mailjetKey;
            }

            var mailjetSecret = Env("MAILJET_SECRET_KEY") ?? Env("Email__MailjetSecretKey");
            if (!string.IsNullOrWhiteSpace(mailjetSecret))
            {
                options.MailjetSecretKey = mailjetSecret;
            }

            if (string.IsNullOrWhiteSpace(options.Host))
            {
                options.Host = Env("SMTP_HOST") ?? Env("Email__Host") ?? options.Host;
            }

            if (Env("SMTP_PORT") is { Length: > 0 } portText && int.TryParse(portText, out var port))
            {
                options.Port = port;
            }

            if (Env("SMTP_USE_SSL") is { Length: > 0 } sslText
                && bool.TryParse(sslText, out var useSsl))
            {
                options.UseSsl = useSsl;
            }

            if (string.IsNullOrWhiteSpace(options.Username))
            {
                options.Username = Env("SMTP_USERNAME") ?? Env("Email__Username") ?? options.Username;
            }

            if (string.IsNullOrWhiteSpace(options.Password))
            {
                options.Password = Env("SMTP_PASSWORD") ?? Env("Email__Password") ?? options.Password;
            }

            var from = Env("SMTP_FROM") ?? Env("Email__FromAddress");
            if (!string.IsNullOrWhiteSpace(from))
            {
                options.FromAddress = from;
            }

            var fromName = Env("Email__FromName");
            if (!string.IsNullOrWhiteSpace(fromName))
            {
                options.FromName = fromName;
            }

            var frontend =
                Env("FRONTEND_BASE_URL")
                ?? Env("Email__FrontendBaseUrl");
            if (!string.IsNullOrWhiteSpace(frontend))
            {
                options.FrontendBaseUrl = frontend;
            }
        });

        services.AddScoped<IEmailService, EmailService>();
        services.AddSingleton<IEmailMailboxVerifier, EmailMailboxVerifier>();

        return services;
    }
}
