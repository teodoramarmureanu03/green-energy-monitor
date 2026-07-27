using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Registered application user. Password is stored as a BCrypt hash only.
/// Username is the unique login identity; email may be shared across accounts.
/// </summary>
public class AppUser
{
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Unique login name (case-insensitive).
    /// </summary>
    public string Username { get; set; } = "";

    public string Email { get; set; } = "";

    public string DisplayName { get; set; } = "";

    /// <summary>
    /// "Male", "Female", or "Other" — used for the toolbar avatar.
    /// </summary>
    public string Gender { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    /// <summary>
    /// SHA-256 hash of the one-time password reset token (null when none is active).
    /// </summary>
    public string? PasswordResetTokenHash { get; set; }

    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    /// <summary>
    /// When true, the user can open the admin users dashboard.
    /// </summary>
    public bool IsAdmin { get; set; }

    public DateTime CreatedAt { get; set; }
}
