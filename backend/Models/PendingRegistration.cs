using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Signup data held until the email verification link is opened.
/// The real user account is created only after verification.
/// </summary>
public class PendingRegistration
{
    [Key]
    public int Id { get; set; }

    public string Username { get; set; } = "";

    public string Email { get; set; } = "";

    public string DisplayName { get; set; } = "";

    public string Gender { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    /// <summary>
    /// SHA-256 hash of the one-time email verification token.
    /// </summary>
    public string TokenHash { get; set; } = "";

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
