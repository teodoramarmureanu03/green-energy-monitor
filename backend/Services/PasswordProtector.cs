using System.Security.Cryptography;
using System.Text;

namespace backend.Services;

/// <summary>
/// Password hashing with a server-side pepper (HMAC-SHA256) then BCrypt.
/// The pepper lives only in env/config — never in the database.
/// </summary>
public class PasswordProtector
{
    private readonly byte[] _pepperBytes;

    public PasswordProtector(IConfiguration configuration)
    {
        var pepper =
            configuration["PasswordPepper"]
            ?? Environment.GetEnvironmentVariable("PASSWORD_PEPPER")
            ?? "green-energy-monitor-dev-password-pepper-change-me!";

        _pepperBytes = Encoding.UTF8.GetBytes(pepper);
    }

    /// <summary>HMAC-SHA256(pepper, password) as hex, then BCrypt.</summary>
    public string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(ApplyPepper(password));

    /// <summary>
    /// Verifies a peppered hash; falls back to legacy plain BCrypt for older accounts.
    /// </summary>
    public bool Verify(string password, string passwordHash)
    {
        if (string.IsNullOrEmpty(passwordHash))
        {
            return false;
        }

        try
        {
            if (BCrypt.Net.BCrypt.Verify(ApplyPepper(password), passwordHash))
            {
                return true;
            }
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // Fall through to legacy check.
        }

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }

    /// <summary>
    /// True when the password matches a legacy (unpeppered) hash and should be upgraded.
    /// </summary>
    public bool IsLegacyHash(string password, string passwordHash)
    {
        try
        {
            if (BCrypt.Net.BCrypt.Verify(ApplyPepper(password), passwordHash))
            {
                return false;
            }
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // continue
        }

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }

    private string ApplyPepper(string password)
    {
        using var hmac = new HMACSHA256(_pepperBytes);
        var digest = hmac.ComputeHash(Encoding.UTF8.GetBytes(password ?? string.Empty));
        return Convert.ToHexString(digest);
    }
}
