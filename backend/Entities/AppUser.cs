using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Registered application user. Password is stored as a BCrypt hash only.
/// </summary>
public class AppUser
{
    [Key]
    public int Id { get; set; }

    public string Email { get; set; } = "";

    public string DisplayName { get; set; } = "";

    /// <summary>
    /// "Male" or "Female" — used for the toolbar avatar.
    /// </summary>
    public string Gender { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    /// <summary>
    /// SHA-256 hash of the one-time password reset token (null when none is active).
    /// </summary>
    public string? PasswordResetTokenHash { get; set; }

    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
