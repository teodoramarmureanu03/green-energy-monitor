using backend.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace backend.Services;

public interface IEmailService
{
    Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
}

public class EmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.Host))
        {
            throw new InvalidOperationException(
                "SMTP is not configured. Set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in .env.");
        }

        if (LooksLikePlaceholder(_options.Username) || LooksLikePlaceholder(_options.Password) || LooksLikePlaceholder(_options.FromAddress))
        {
            throw new InvalidOperationException(
                "SMTP credentials are still placeholders. Put your real Gmail address and a Google App Password in .env.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        try
        {
            message.To.Add(MailboxAddress.Parse(toEmail));
        }
        catch (ParseException ex)
        {
            throw new InvalidOperationException(
                "That email address is invalid. Check it and try again.",
                ex);
        }

        using var client = new SmtpClient();
        var secureSocketOptions = ResolveSecureSocketOptions(_options.Port, _options.UseSsl);

        try
        {
            _logger.LogInformation(
                "Connecting to SMTP {Host}:{Port} ({Mode}) to send email to {Email}",
                _options.Host,
                _options.Port,
                secureSocketOptions,
                toEmail);

            await client.ConnectAsync(_options.Host, _options.Port, secureSocketOptions, cancellationToken);

            if (!string.IsNullOrWhiteSpace(_options.Username))
            {
                // Google App Passwords are often copied with spaces; SMTP expects 16 chars.
                var password = (_options.Password ?? "").Replace(" ", "");
                await client.AuthenticateAsync(_options.Username, password, cancellationToken);
            }

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Sent email to {Email}: {Subject}", toEmail, subject);
        }
        catch (ParseException ex)
        {
            throw new InvalidOperationException(
                "That email address is invalid. Check it and try again.",
                ex);
        }
        catch (SmtpCommandException ex)
        {
            _logger.LogError(ex, "SMTP command failed while sending to {Email}", toEmail);
            var detail = (ex.Message ?? "").ToLowerInvariant();
            if (detail.Contains("mailbox")
                || detail.Contains("recipient")
                || detail.Contains("user unknown")
                || detail.Contains("not found")
                || detail.Contains("does not exist")
                || ex.ErrorCode == SmtpErrorCode.RecipientNotAccepted)
            {
                throw new InvalidOperationException(
                    "That email address is invalid or cannot receive mail. Check it and try again.",
                    ex);
            }

            throw new InvalidOperationException(
                "Could not send the verification email. Please try again in a moment.",
                ex);
        }
        catch (SmtpProtocolException ex)
        {
            _logger.LogError(ex, "SMTP protocol error while sending to {Email}", toEmail);
            throw new InvalidOperationException(
                "Could not send the verification email. Please try again in a moment.",
                ex);
        }
    }

    private static SecureSocketOptions ResolveSecureSocketOptions(int port, bool useSsl)
    {
        // Port 465 expects implicit SSL. Port 587 expects STARTTLS.
        if (port == 465)
        {
            return SecureSocketOptions.SslOnConnect;
        }

        if (port == 587 || useSsl)
        {
            return SecureSocketOptions.StartTls;
        }

        return SecureSocketOptions.Auto;
    }

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
            || normalized.Contains("example.com");
    }
}
