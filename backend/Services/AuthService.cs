using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Models;
using MailKit.Net.Smtp;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MimeKit;

namespace backend.Services;

public class AuthService
{
    private static readonly TimeSpan PasswordResetTokenLifetime = TimeSpan.FromHours(1);
    private static readonly TimeSpan EmailVerificationTokenLifetime = TimeSpan.FromHours(24);

    public const string AdminEmail = "admin@gmail.com";
    public const string AdminUsername = "admin";
    public const string AdminDisplayName = "Admin";
    public const string AdminPassword = "admin";
    public const string AdminRole = "Admin";

    private readonly EnergyDbContext _db;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly IEmailMailboxVerifier _mailboxVerifier;
    private readonly EmailOptions _emailOptions;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        EnergyDbContext db,
        IConfiguration config,
        IEmailService emailService,
        IEmailMailboxVerifier mailboxVerifier,
        IOptions<EmailOptions> emailOptions,
        ILogger<AuthService> logger)
    {
        _db = db;
        _config = config;
        _emailService = emailService;
        _mailboxVerifier = mailboxVerifier;
        _emailOptions = emailOptions.Value;
        _logger = logger;
    }

    public async Task EnsureAdminUserAsync()
    {
        var admin = await _db.Users.FirstOrDefaultAsync(user => user.IsAdmin)
            ?? await _db.Users.FirstOrDefaultAsync(user => user.Username == AdminUsername)
            ?? await _db.Users.FirstOrDefaultAsync(user => user.Email == AdminEmail);

        if (admin is null)
        {
            _db.Users.Add(new AppUser
            {
                Username = AdminUsername,
                Email = AdminEmail,
                DisplayName = AdminDisplayName,
                Gender = "Other",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword),
                IsAdmin = true,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();
            return;
        }

        admin.IsAdmin = true;

        var adminUsernameTaken = await _db.Users.AnyAsync(user =>
            user.Username == AdminUsername && user.Id != admin.Id);
        if (!adminUsernameTaken)
        {
            admin.Username = AdminUsername;
        }
        else if (string.IsNullOrWhiteSpace(admin.Username))
        {
            admin.Username = $"{AdminUsername}_{admin.Id}";
        }

        if (string.IsNullOrWhiteSpace(admin.DisplayName))
        {
            admin.DisplayName = AdminDisplayName;
        }

        if (string.IsNullOrWhiteSpace(admin.Gender))
        {
            admin.Gender = "Other";
        }

        await _db.SaveChangesAsync();
    }

    public async Task<(string? Message, string? Error)> RegisterAsync(RegisterRequest request)
    {
        var username = NormalizeUsername(request.Username);
        var email = NormalizeEmail(request.Email);
        var displayName = request.DisplayName?.Trim() ?? "";
        var password = request.Password ?? "";

        var usernameError = ValidateUsername(username);
        if (usernameError is not null)
        {
            return (null, usernameError);
        }

        if (!IsValidEmailAddress(email))
        {
            return (null, "That email address is invalid. Check it and try again.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return (null, "Display name is required.");
        }

        var gender = NormalizeGender(request.Gender);
        if (gender is null)
        {
            return (null, "Select male, female, or other.");
        }

        if (string.IsNullOrEmpty(password))
        {
            return (null, "Password is required.");
        }

        await CleanupExpiredPendingRegistrationsAsync();

        var usernameTaken = await _db.Users.AnyAsync(user => user.Username == username);
        if (usernameTaken)
        {
            return (null, "That username is already taken.");
        }

        var resolvedDisplayName = displayName;
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        // No SMTP secrets on the host → create the account immediately so public
        // users can register without needing (or seeing) server email config.
        if (!_emailService.IsConfigured)
        {
            _logger.LogWarning(
                "SMTP is not configured; creating account {Username} without email verification.",
                username);

            var stalePending = await _db.PendingRegistrations
                .FirstOrDefaultAsync(item => item.Username == username);
            if (stalePending is not null)
            {
                _db.PendingRegistrations.Remove(stalePending);
            }

            _db.Users.Add(new AppUser
            {
                Username = username,
                Email = email,
                DisplayName = resolvedDisplayName,
                Gender = gender,
                PasswordHash = passwordHash,
                IsAdmin = false,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();

            return ("Account created. You can sign in now.", null);
        }

        var mailboxStatus = await _mailboxVerifier.CheckAsync(email);
        if (mailboxStatus == MailboxCheckStatus.Undeliverable)
        {
            return (null, "That email address is invalid or cannot receive mail. Check it and try again.");
        }

        var rawToken = CreateUrlSafeToken();
        var tokenHash = HashToken(rawToken);

        var existingPending = await _db.PendingRegistrations
            .FirstOrDefaultAsync(item => item.Username == username);

        if (existingPending is not null)
        {
            existingPending.Email = email;
            existingPending.DisplayName = resolvedDisplayName;
            existingPending.Gender = gender;
            existingPending.PasswordHash = passwordHash;
            existingPending.TokenHash = tokenHash;
            existingPending.ExpiresAt = DateTime.UtcNow.Add(EmailVerificationTokenLifetime);
            existingPending.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.PendingRegistrations.Add(new PendingRegistration
            {
                Username = username,
                Email = email,
                DisplayName = resolvedDisplayName,
                Gender = gender,
                PasswordHash = passwordHash,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.Add(EmailVerificationTokenLifetime),
                CreatedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();

        var baseUrl = (_emailOptions.FrontendBaseUrl ?? "http://localhost:3000").TrimEnd('/');
        var verifyUrl = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(rawToken)}";

        var html = $"""
            <p>Hello {System.Net.WebUtility.HtmlEncode(resolvedDisplayName)},</p>
            <p>Confirm your Green Energy Monitor signup for username <strong>{System.Net.WebUtility.HtmlEncode(username)}</strong>.</p>
            <p><a href="{verifyUrl}">Verify email and create account</a></p>
            <p>This link expires in 24 hours. Your account is not created until you verify.</p>
            """;

        try
        {
            await _emailService.SendAsync(
                email,
                "Verify your Green Energy Monitor email",
                html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email for username {Username}.", username);

            var pendingToRemove = await _db.PendingRegistrations
                .FirstOrDefaultAsync(item => item.Username == username);
            if (pendingToRemove is not null)
            {
                _db.PendingRegistrations.Remove(pendingToRemove);
                await _db.SaveChangesAsync();
            }

            if (LooksLikeInvalidRecipientError(ex))
            {
                return (null, "That email address is invalid or cannot receive mail. Check it and try again.");
            }

            return (null, "Could not send the verification email. Please try again in a moment.");
        }

        return (
            $"Verification email sent to {email}. Open the link in that message to create your account.",
            null);
    }

    public async Task<(AuthResponse? Response, string? Error)> VerifyEmailAsync(VerifyEmailRequest request)
    {
        var token = request.Token?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(token))
        {
            return (null, "Verification link is invalid or has expired.");
        }

        await CleanupExpiredPendingRegistrationsAsync();

        var tokenHash = HashToken(token);
        var pending = await _db.PendingRegistrations.FirstOrDefaultAsync(item =>
            item.TokenHash == tokenHash);

        if (pending is null || pending.ExpiresAt < DateTime.UtcNow)
        {
            return (null, "Verification link is invalid or has expired.");
        }

        var usernameTaken = await _db.Users.AnyAsync(user => user.Username == pending.Username);
        if (usernameTaken)
        {
            _db.PendingRegistrations.Remove(pending);
            await _db.SaveChangesAsync();
            return (null, "That username is already taken. Please register again with a different username.");
        }

        var user = new AppUser
        {
            Username = pending.Username,
            Email = pending.Email,
            DisplayName = pending.DisplayName,
            Gender = pending.Gender,
            PasswordHash = pending.PasswordHash,
            IsAdmin = false,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        _db.PendingRegistrations.Remove(pending);
        await _db.SaveChangesAsync();

        return (BuildAuthResponse(user), null);
    }

    public async Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request)
    {
        var username = NormalizeUsername(request.Username);
        var password = request.Password ?? "";

        if (string.IsNullOrWhiteSpace(username))
        {
            return (null, "Username is required.");
        }

        if (string.IsNullOrEmpty(password))
        {
            return (null, "Password is required.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(item => item.Username == username);
        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return (null, "Invalid username or password.");
        }

        return (BuildAuthResponse(user), null);
    }

    public async Task<AuthUserDto?> GetUserAsync(int userId)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId);

        return user is null ? null : ToDto(user);
    }

    public async Task<(AuthResponse? Response, string? Error)> UpdateProfileAsync(
        int userId,
        UpdateProfileRequest request)
    {
        var username = NormalizeUsername(request.Username);
        var email = NormalizeEmail(request.Email);
        var displayName = request.DisplayName?.Trim() ?? "";

        var usernameError = ValidateUsername(username);
        if (usernameError is not null)
        {
            return (null, usernameError);
        }

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return (null, "Enter a valid email address.");
        }

        var gender = NormalizeGender(request.Gender);
        if (gender is null)
        {
            return (null, "Select male, female, or other.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return (null, "Account not found.");
        }

        var usernameTaken = await _db.Users.AnyAsync(item =>
            item.Username == username && item.Id != userId);
        if (usernameTaken)
        {
            return (null, "That username is already taken.");
        }

        user.Username = username;
        user.Email = email;
        user.DisplayName = displayName;
        user.Gender = gender;
        await _db.SaveChangesAsync();

        return (BuildAuthResponse(user), null);
    }

    public async Task<(bool Ok, string? Error)> ChangePasswordAsync(
        int userId,
        ChangePasswordRequest request)
    {
        var currentPassword = request.CurrentPassword ?? "";
        var newPassword = request.NewPassword ?? "";

        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return (false, "Account not found.");
        }

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
        {
            return (false, "Current password is incorrect.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        ClearPasswordResetToken(user);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task RequestPasswordResetAsync(ForgotPasswordRequest request)
    {
        if (!_emailService.IsConfigured)
        {
            throw new InvalidOperationException(
                "Password reset by email is temporarily unavailable. Please try again later or contact an admin.");
        }

        var username = NormalizeUsername(request.Username);
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email))
        {
            return;
        }

        var user = await _db.Users.FirstOrDefaultAsync(item =>
            item.Username == username && item.Email == email);
        if (user is null)
        {
            return;
        }

        var rawToken = CreateUrlSafeToken();

        user.PasswordResetTokenHash = HashToken(rawToken);
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.Add(PasswordResetTokenLifetime);
        await _db.SaveChangesAsync();

        var baseUrl = (_emailOptions.FrontendBaseUrl ?? "http://localhost:3000").TrimEnd('/');
        var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

        var html = $"""
            <p>Hello {System.Net.WebUtility.HtmlEncode(user.DisplayName)},</p>
            <p>We received a request to reset the Green Energy Monitor password for username <strong>{System.Net.WebUtility.HtmlEncode(user.Username)}</strong>.</p>
            <p><a href="{resetUrl}">Reset your password</a></p>
            <p>This link expires in 1 hour and only changes the password for that username. If you did not request a reset, you can ignore this email.</p>
            """;

        try
        {
            await _emailService.SendAsync(
                user.Email,
                "Reset your Green Energy Monitor password",
                html);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send password reset email for user {UserId}.",
                user.Id);
            throw new InvalidOperationException(
                "Could not send the reset email. Please try again in a moment.",
                ex);
        }
    }

    public async Task<(bool Ok, string? Error)> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var token = request.Token?.Trim() ?? "";
        var newPassword = request.NewPassword ?? "";

        if (string.IsNullOrWhiteSpace(token))
        {
            return (false, "Reset link is invalid or has expired.");
        }

        var tokenHash = HashToken(token);
        var user = await _db.Users.FirstOrDefaultAsync(item =>
            item.PasswordResetTokenHash == tokenHash);

        if (user is null
            || user.PasswordResetTokenExpiresAt is null
            || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
        {
            return (false, "Reset link is invalid or has expired.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        ClearPasswordResetToken(user);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Ok, string? Error)> DeleteAccountAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return (false, "Account not found.");
        }

        if (user.IsAdmin || user.Username == AdminUsername)
        {
            return (false, "The admin account cannot be deleted.");
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<List<AdminUserDto>> ListUsersAsync()
    {
        return await _db.Users
            .AsNoTracking()
            .OrderByDescending(user => user.IsAdmin)
            .ThenBy(user => user.Username)
            .Select(user => new AdminUserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Gender = user.Gender,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt,
            })
            .ToListAsync();
    }

    public async Task<(AdminUserDto? User, string? Error)> AdminCreateUserAsync(
        AdminCreateUserRequest request)
    {
        var username = NormalizeUsername(request.Username);
        var email = NormalizeEmail(request.Email);
        var displayName = request.DisplayName?.Trim() ?? "";
        var password = request.Password ?? "";

        var usernameError = ValidateUsername(username);
        if (usernameError is not null)
        {
            return (null, usernameError);
        }

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return (null, "Enter a valid email address.");
        }

        var gender = NormalizeGender(request.Gender) ?? "Other";

        var usernameTaken = await _db.Users.AnyAsync(user => user.Username == username);
        if (usernameTaken)
        {
            return (null, "That username is already taken.");
        }

        var pending = await _db.PendingRegistrations
            .FirstOrDefaultAsync(item => item.Username == username);
        if (pending is not null)
        {
            _db.PendingRegistrations.Remove(pending);
        }

        var user = new AppUser
        {
            Username = username,
            Email = email,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? username : displayName,
            Gender = gender,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            IsAdmin = false,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return (ToAdminDto(user), null);
    }

    public async Task<(AdminUserDto? User, string? Error)> AdminUpdateUserAsync(
        int userId,
        AdminUpdateUserRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return (null, "Account not found.");
        }

        var username = NormalizeUsername(request.Username);
        var email = NormalizeEmail(request.Email);
        var displayName = request.DisplayName?.Trim() ?? "";
        var gender = NormalizeGender(request.Gender) ?? user.Gender;

        var usernameError = ValidateUsername(username);
        if (usernameError is not null)
        {
            return (null, usernameError);
        }

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return (null, "Enter a valid email address.");
        }

        var usernameTaken = await _db.Users.AnyAsync(item =>
            item.Username == username && item.Id != userId);
        if (usernameTaken)
        {
            return (null, "That username is already taken.");
        }

        user.Username = username;
        user.Email = email;
        user.DisplayName = string.IsNullOrWhiteSpace(displayName) ? user.DisplayName : displayName;
        user.Gender = gender;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _db.SaveChangesAsync();
        return (ToAdminDto(user), null);
    }

    public async Task<(bool Ok, string? Error)> AdminDeleteUserAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return (false, "Account not found.");
        }

        if (user.IsAdmin || user.Username == AdminUsername)
        {
            return (false, "The admin account cannot be deleted.");
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    private AuthResponse BuildAuthResponse(AppUser user)
    {
        return new AuthResponse
        {
            Token = CreateToken(user),
            User = ToDto(user),
        };
    }

    private string CreateToken(AppUser user)
    {
        var secret = _config["Jwt:Key"]
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? "green-energy-monitor-dev-jwt-key-change-me-32chars!";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        };

        if (user.IsAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, AdminRole));
        }

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "green-energy-monitor",
            audience: _config["Jwt:Audience"] ?? "green-energy-monitor",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(14),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static AuthUserDto ToDto(AppUser user) =>
        new()
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Gender = user.Gender,
            IsAdmin = user.IsAdmin,
        };

    private static AdminUserDto ToAdminDto(AppUser user) =>
        new()
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Gender = user.Gender,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt,
        };

    private static string? NormalizeGender(string? gender)
    {
        var value = (gender ?? "").Trim();
        if (value.Equals("Male", StringComparison.OrdinalIgnoreCase))
        {
            return "Male";
        }

        if (value.Equals("Female", StringComparison.OrdinalIgnoreCase))
        {
            return "Female";
        }

        if (value.Equals("Other", StringComparison.OrdinalIgnoreCase))
        {
            return "Other";
        }

        return null;
    }

    private static string NormalizeEmail(string? email) =>
        (email ?? "").Trim().ToLowerInvariant();

    private static bool IsValidEmailAddress(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return false;
        }

        try
        {
            var parsed = MailboxAddress.Parse(email);
            return !string.IsNullOrWhiteSpace(parsed.Address)
                && parsed.Address.Contains('@')
                && parsed.Address.IndexOf('@') > 0
                && parsed.Address.IndexOf('@') < parsed.Address.Length - 1;
        }
        catch
        {
            return false;
        }
    }

    private static bool LooksLikeInvalidRecipientError(Exception ex)
    {
        for (var current = ex; current is not null; current = current.InnerException)
        {
            if (current is ParseException)
            {
                return true;
            }

            if (current is SmtpCommandException smtp
                && smtp.ErrorCode == SmtpErrorCode.RecipientNotAccepted)
            {
                return true;
            }

            var text = (current.Message ?? "").ToLowerInvariant();
            if (text.Contains("mailbox unavailable")
                || text.Contains("user unknown")
                || text.Contains("invalid address")
                || text.Contains("invalid mailbox")
                || text.Contains("recipient address rejected")
                || text.Contains("no such user")
                || text.Contains("address not found")
                || text.Contains("not found")
                || text.Contains("does not exist")
                || text.Contains("cannot receive mail"))
            {
                return true;
            }
        }

        return false;
    }

    private static string NormalizeUsername(string? username) =>
        (username ?? "").Trim().ToLowerInvariant();

    private static string? ValidateUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return "Username is required.";
        }

        if (username.Length < 2)
        {
            return "Username must be at least 2 characters.";
        }

        if (username.Contains(' ') || username.Contains('@'))
        {
            return "Username cannot contain spaces or @.";
        }

        return null;
    }

    private async Task CleanupExpiredPendingRegistrationsAsync()
    {
        var expired = await _db.PendingRegistrations
            .Where(item => item.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        if (expired.Count == 0)
        {
            return;
        }

        _db.PendingRegistrations.RemoveRange(expired);
        await _db.SaveChangesAsync();
    }

    private static string CreateUrlSafeToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

    private static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }

    private static void ClearPasswordResetToken(AppUser user)
    {
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
    }
}
