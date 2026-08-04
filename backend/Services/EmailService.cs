using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using backend.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace backend.Services;

public interface IEmailService
{
    bool IsConfigured { get; }

    Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
}

public class EmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<EmailOptions> options,
        IHttpClientFactory httpClientFactory,
        ILogger<EmailService> logger
    )
    {
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool IsConfigured => _options.IsConfigured;

    public async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default
    )
    {
        if (!_options.IsConfigured)
        {
            throw new InvalidOperationException(
                "Email sending is temporarily unavailable. Please try again later."
            );
        }

        if (_options.HasResend)
        {
            await SendWithResendAsync(toEmail, subject, htmlBody, cancellationToken);
            return;
        }

        await SendWithSmtpAsync(toEmail, subject, htmlBody, cancellationToken);
    }

    private async Task SendWithResendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken
    )
    {
        var fromAddress = string.IsNullOrWhiteSpace(_options.FromAddress)
            ? "onboarding@resend.dev"
            : _options.FromAddress.Trim();
        var from = string.IsNullOrWhiteSpace(_options.FromName)
            ? fromAddress
            : $"{_options.FromName} <{fromAddress}>";

        var client = _httpClientFactory.CreateClient("resend");
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ResendApiKey.Trim());
        request.Content = JsonContent.Create(
            new ResendSendRequest
            {
                From = from,
                To = [toEmail],
                Subject = subject,
                Html = htmlBody,
            }
        );

        _logger.LogInformation("Sending email via Resend to {Email}: {Subject}", toEmail, subject);

        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "Resend API failed ({Status}): {Body}",
                (int)response.StatusCode,
                body
            );

            var lower = body.ToLowerInvariant();
            if (lower.Contains("invalid") && lower.Contains("to"))
            {
                throw new InvalidOperationException(
                    "That email address cannot receive mail from Resend yet. On the free plan without a verified domain, you can only send to your Resend account email — or verify a domain in Resend.",
                    new InvalidOperationException(body)
                );
            }

            throw new InvalidOperationException(
                "Could not send the email. Please try again in a moment.",
                new InvalidOperationException(body)
            );
        }

        _logger.LogInformation("Sent email via Resend to {Email}: {Subject}", toEmail, subject);
    }

    private async Task SendWithSmtpAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken
    )
    {
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
                ex
            );
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
                toEmail
            );

            await client.ConnectAsync(
                _options.Host,
                _options.Port,
                secureSocketOptions,
                cancellationToken
            );

            if (!string.IsNullOrWhiteSpace(_options.Username))
            {
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
                ex
            );
        }
        catch (SmtpCommandException ex)
        {
            _logger.LogError(ex, "SMTP command failed while sending to {Email}", toEmail);
            var detail = (ex.Message ?? "").ToLowerInvariant();
            if (
                detail.Contains("mailbox")
                || detail.Contains("recipient")
                || detail.Contains("user unknown")
                || detail.Contains("not found")
                || detail.Contains("does not exist")
                || ex.ErrorCode == SmtpErrorCode.RecipientNotAccepted
            )
            {
                throw new InvalidOperationException(
                    "That email address is invalid or cannot receive mail. Check it and try again.",
                    ex
                );
            }

            throw new InvalidOperationException(
                "Could not send the verification email. Please try again in a moment.",
                ex
            );
        }
        catch (SmtpProtocolException ex)
        {
            _logger.LogError(ex, "SMTP protocol error while sending to {Email}", toEmail);
            throw new InvalidOperationException(
                "Could not send the verification email. Please try again in a moment.",
                ex
            );
        }
    }

    private static SecureSocketOptions ResolveSecureSocketOptions(int port, bool useSsl)
    {
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

    private sealed class ResendSendRequest
    {
        [JsonPropertyName("from")]
        public string From { get; set; } = "";

        [JsonPropertyName("to")]
        public string[] To { get; set; } = [];

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = "";

        [JsonPropertyName("html")]
        public string Html { get; set; } = "";
    }
}
