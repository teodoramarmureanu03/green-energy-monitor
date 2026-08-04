using backend.Models;

namespace backend.DTOs;

public class ForgotPasswordRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    /// <summary>Used when EMAIL_BYPASS / no SMTP (direct reset).</summary>
    public string? NewPassword { get; set; }
    public string? ConfirmPassword { get; set; }
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class VerifyEmailRequest
{
    public string Token { get; set; } = string.Empty;
}
