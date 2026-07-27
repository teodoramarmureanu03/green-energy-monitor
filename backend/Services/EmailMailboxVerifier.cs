using System.Net.Sockets;
using System.Text;
using DnsClient;
using MimeKit;

namespace backend.Services;

public enum MailboxCheckStatus
{
    /// <summary>Mailbox appears deliverable (or provider accepted RCPT).</summary>
    Deliverable,

    /// <summary>Provider clearly rejected the mailbox.</summary>
    Undeliverable,

    /// <summary>Could not determine (timeout, blocked port 25, etc.).</summary>
    Unknown,
}

public interface IEmailMailboxVerifier
{
    Task<MailboxCheckStatus> CheckAsync(string email, CancellationToken cancellationToken = default);
}

/// <summary>
/// Checks whether a mailbox looks deliverable by querying MX records and
/// issuing SMTP RCPT TO against the recipient's mail server.
/// Gmail's submission SMTP accepts almost everything and bounces later;
/// checking the recipient MX catches many non-existent addresses up front.
/// </summary>
public class EmailMailboxVerifier : IEmailMailboxVerifier
{
    private static readonly TimeSpan ConnectTimeout = TimeSpan.FromSeconds(8);
    private readonly ILogger<EmailMailboxVerifier> _logger;
    private readonly LookupClient _dns = new();

    public EmailMailboxVerifier(ILogger<EmailMailboxVerifier> logger)
    {
        _logger = logger;
    }

    public async Task<MailboxCheckStatus> CheckAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        MailboxAddress mailbox;
        try
        {
            mailbox = MailboxAddress.Parse(email);
        }
        catch (ParseException)
        {
            return MailboxCheckStatus.Undeliverable;
        }

        var address = mailbox.Address;
        var at = address.LastIndexOf('@');
        if (at <= 0 || at == address.Length - 1)
        {
            return MailboxCheckStatus.Undeliverable;
        }

        var domain = address[(at + 1)..];
        var mxHosts = await ResolveMxHostsAsync(domain, cancellationToken);
        if (mxHosts.Count == 0)
        {
            _logger.LogInformation("No MX/A records for domain {Domain}", domain);
            return MailboxCheckStatus.Undeliverable;
        }

        foreach (var host in mxHosts.Take(3))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var status = await ProbeSmtpRecipientAsync(host, address, cancellationToken);
            if (status is MailboxCheckStatus.Deliverable or MailboxCheckStatus.Undeliverable)
            {
                return status;
            }
        }

        return MailboxCheckStatus.Unknown;
    }

    private async Task<List<string>> ResolveMxHostsAsync(
        string domain,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _dns.QueryAsync(domain, QueryType.MX, cancellationToken: cancellationToken);
            var hosts = result.Answers.MxRecords()
                .OrderBy(record => record.Preference)
                .Select(record => record.Exchange.Value.TrimEnd('.'))
                .Where(host => !string.IsNullOrWhiteSpace(host))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (hosts.Count > 0)
            {
                return hosts;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "MX lookup failed for {Domain}", domain);
        }

        // Some domains use a bare A/AAAA record instead of MX.
        try
        {
            var aResult = await _dns.QueryAsync(domain, QueryType.A, cancellationToken: cancellationToken);
            if (aResult.Answers.ARecords().Any())
            {
                return [domain];
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "A lookup failed for {Domain}", domain);
        }

        return [];
    }

    private async Task<MailboxCheckStatus> ProbeSmtpRecipientAsync(
        string mxHost,
        string recipient,
        CancellationToken cancellationToken)
    {
        try
        {
            using var client = new TcpClient();
            using var connectCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            connectCts.CancelAfter(ConnectTimeout);

            await client.ConnectAsync(mxHost, 25, connectCts.Token);
            client.ReceiveTimeout = (int)ConnectTimeout.TotalMilliseconds;
            client.SendTimeout = (int)ConnectTimeout.TotalMilliseconds;

            await using var stream = client.GetStream();
            using var reader = new StreamReader(stream, Encoding.ASCII, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
            await using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true) { NewLine = "\r\n", AutoFlush = true };

            var greeting = await ReadSmtpReplyAsync(reader, cancellationToken);
            if (greeting.Code < 200 || greeting.Code >= 300)
            {
                return MailboxCheckStatus.Unknown;
            }

            await writer.WriteLineAsync($"EHLO green-energy-monitor.local");
            var ehlo = await ReadSmtpReplyAsync(reader, cancellationToken);
            if (ehlo.Code >= 400)
            {
                await writer.WriteLineAsync("HELO green-energy-monitor.local");
                var helo = await ReadSmtpReplyAsync(reader, cancellationToken);
                if (helo.Code >= 400)
                {
                    return MailboxCheckStatus.Unknown;
                }
            }

            await writer.WriteLineAsync("MAIL FROM:<>");
            var mailFrom = await ReadSmtpReplyAsync(reader, cancellationToken);
            if (mailFrom.Code >= 400)
            {
                // Some servers reject empty MAIL FROM; retry with a dummy address.
                await writer.WriteLineAsync("MAIL FROM:<verify@green-energy-monitor.local>");
                mailFrom = await ReadSmtpReplyAsync(reader, cancellationToken);
                if (mailFrom.Code >= 400)
                {
                    return MailboxCheckStatus.Unknown;
                }
            }

            await writer.WriteLineAsync($"RCPT TO:<{recipient}>");
            var rcpt = await ReadSmtpReplyAsync(reader, cancellationToken);

            try
            {
                await writer.WriteLineAsync("RSET");
                _ = await ReadSmtpReplyAsync(reader, cancellationToken);
                await writer.WriteLineAsync("QUIT");
            }
            catch
            {
                // Best-effort cleanup.
            }

            if (rcpt.Code >= 200 && rcpt.Code < 300)
            {
                return MailboxCheckStatus.Deliverable;
            }

            if (rcpt.Code >= 500
                || LooksLikeMailboxMissing(rcpt.Text))
            {
                _logger.LogInformation(
                    "MX {Mx} rejected {Recipient}: {Code} {Text}",
                    mxHost,
                    recipient,
                    rcpt.Code,
                    rcpt.Text.Trim());
                return MailboxCheckStatus.Undeliverable;
            }

            return MailboxCheckStatus.Unknown;
        }
        catch (Exception ex) when (ex is SocketException or IOException or OperationCanceledException)
        {
            _logger.LogDebug(ex, "SMTP probe to MX {Mx} for {Recipient} failed", mxHost, recipient);
            return MailboxCheckStatus.Unknown;
        }
    }

    private static bool LooksLikeMailboxMissing(string text)
    {
        var value = text.ToLowerInvariant();
        return value.Contains("does not exist")
            || value.Contains("user unknown")
            || value.Contains("no such user")
            || value.Contains("mailbox unavailable")
            || value.Contains("address rejected")
            || value.Contains("recipient rejected")
            || value.Contains("unknown user")
            || value.Contains("invalid mailbox")
            || value.Contains("not found");
    }

    private static async Task<(int Code, string Text)> ReadSmtpReplyAsync(
        StreamReader reader,
        CancellationToken cancellationToken)
    {
        var builder = new StringBuilder();
        var code = 0;

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var line = await reader.ReadLineAsync(cancellationToken);
            if (line is null)
            {
                break;
            }

            builder.AppendLine(line);
            if (line.Length >= 3 && int.TryParse(line.AsSpan(0, 3), out var parsed))
            {
                code = parsed;
            }

            // Multi-line replies use "250-..." then end with "250 ..."
            if (line.Length < 4 || line[3] == ' ')
            {
                break;
            }
        }

        return (code, builder.ToString());
    }
}
