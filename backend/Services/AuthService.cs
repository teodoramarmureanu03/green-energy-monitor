using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public interface IAuthService
{
    Task<AuthSession?> LoginAsync(string username, string password);
    /// <summary>
    /// Returns a session when the account is created immediately (SMTP off),
    /// or a message when a verification email was sent.
    /// </summary>
    Task<(AuthSession? Session, string? Message)> RegisterAsync(
        string username,
        string email,
        string displayName,
        string gender,
        string password,
        string confirmPassword
    );
    Task<AuthSession?> VerifyEmailAsync(string token);
    /// <summary>
    /// When email bypass is on (or SMTP is off): set a new password with username + email.
    /// Otherwise sends a reset link by email.
    /// </summary>
    Task<string> RequestPasswordResetAsync(
        string username,
        string email,
        string? newPassword = null,
        string? confirmPassword = null
    );
    Task<(bool Ok, string? Error)> ResetPasswordAsync(string token, string newPassword);
    Task<AuthSession?> RefreshAsync(string? rawRefreshToken);
    Task RevokeRefreshTokenAsync(string? rawRefreshToken);
    Task<User?> GetUserByIdAsync(int userId);
    Task<(AuthSession? Session, string? Error)> UpdateProfileAsync(
        int userId,
        UpdateProfileRequest request
    );
    Task<(bool Ok, string? Error)> ChangePasswordAsync(
        int userId,
        ChangePasswordRequest request
    );
    Task<(bool Ok, string? Error)> DeleteAccountAsync(int userId);
    Task<List<AdminUserDto>> ListUsersAsync();
    Task<(AdminUserDto? User, string? Error)> AdminCreateUserAsync(AdminCreateUserRequest request);
    Task<(AdminUserDto? User, string? Error)> AdminUpdateUserAsync(
        int userId,
        AdminUpdateUserRequest request
    );
    Task<(bool Ok, string? Error)> AdminDeleteUserAsync(int userId);
}

public record AuthSession(string AccessToken, string RefreshToken, User User);

public class AuthService : IAuthService
{
    public const string AdminUsername = "admin";
    public const string AdminRole = "Admin";

    public static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);
    private static readonly TimeSpan PasswordResetTokenLifetime = TimeSpan.FromHours(1);
    private static readonly TimeSpan EmailVerificationTokenLifetime = TimeSpan.FromHours(24);

    private readonly IUserRepository _userRepository;
    private readonly EnergyDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly IEmailMailboxVerifier _mailboxVerifier;
    private readonly EmailOptions _emailOptions;
    private readonly ILogger<AuthService> _logger;
    private readonly PasswordProtector _passwords;

    public AuthService(
        IUserRepository userRepository,
        EnergyDbContext db,
        IConfiguration configuration,
        IEmailService emailService,
        IEmailMailboxVerifier mailboxVerifier,
        IOptions<EmailOptions> emailOptions,
        ILogger<AuthService> logger,
        PasswordProtector passwords
    )
    {
        _userRepository = userRepository;
        _db = db;
        _configuration = configuration;
        _emailService = emailService;
        _mailboxVerifier = mailboxVerifier;
        _emailOptions = emailOptions.Value;
        _logger = logger;
        _passwords = passwords;
    }

    /// <summary>
    /// Skip verify/reset emails only when EMAIL_BYPASS=true.
    /// Prefer Resend (RESEND_API_KEY) on Render — SMTP ports are blocked there.
    /// </summary>
    private bool UseEmailBypass =>
        string.Equals(
            Environment.GetEnvironmentVariable("EMAIL_BYPASS"),
            "true",
            StringComparison.OrdinalIgnoreCase
        );

    public async Task<AuthSession?> LoginAsync(string username, string password)
    {
        username = NormalizeUsername(username);
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var user = await _userRepository.GetUserByUsernameAsync(username);
        if (user is null || !_passwords.Verify(password, user.PasswordHash))
        {
            return null;
        }

        if (_passwords.IsLegacyHash(password, user.PasswordHash))
        {
            user.PasswordHash = _passwords.Hash(password);
            await _db.SaveChangesAsync();
        }

        return await CreateSessionAsync(user);
    }

    public async Task<(AuthSession? Session, string? Message)> RegisterAsync(
        string username,
        string email,
        string displayName,
        string gender,
        string password,
        string confirmPassword
    )
    {
        username = NormalizeUsername(username);
        email = NormalizeEmail(email);
        displayName = (displayName ?? "").Trim();
        password = password?.Trim() ?? "";
        confirmPassword = confirmPassword?.Trim() ?? "";

        var usernameError = ValidateUsername(username);
        if (usernameError is not null)
        {
            throw new InvalidOperationException(usernameError);
        }

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            throw new InvalidOperationException("Enter a valid email address.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new InvalidOperationException("Display name is required.");
        }

        var normalizedGender = NormalizeGender(gender);
        if (normalizedGender is null)
        {
            throw new InvalidOperationException("Select male, female, or other.");
        }

        if (string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException("Password is required.");
        }

        if (password != confirmPassword)
        {
            throw new InvalidOperationException("Passwords do not match.");
        }

        await CleanupExpiredPendingRegistrationsAsync();

        if (await _userRepository.GetUserByUsernameAsync(username) is not null)
        {
            throw new InvalidOperationException("That username is already taken.");
        }

        var passwordHash = _passwords.Hash(password);

        // No SMTP, or explicit/production email bypass → create account immediately.
        if (UseEmailBypass || !_emailService.IsConfigured)
        {
            _logger.LogWarning(
                "Creating account {Username} without email verification (bypass={Bypass}, smtpConfigured={Smtp}).",
                username,
                UseEmailBypass,
                _emailService.IsConfigured
            );

            var stalePending = await _db.PendingRegistrations.FirstOrDefaultAsync(item =>
                item.Username == username
            );
            if (stalePending is not null)
            {
                _db.PendingRegistrations.Remove(stalePending);
            }

            var user = new User
            {
                Username = username,
                Email = email,
                DisplayName = displayName,
                Gender = normalizedGender,
                PasswordHash = passwordHash,
                Role = "Viewer",
                CreatedAt = DateTime.UtcNow,
            };

            await _userRepository.CreateUserAsync(user);
            return (await CreateSessionAsync(user), null);
        }

        var mailboxStatus = await _mailboxVerifier.CheckAsync(email);
        if (mailboxStatus == MailboxCheckStatus.Undeliverable)
        {
            throw new InvalidOperationException(
                "That email address is invalid or cannot receive mail. Check it and try again."
            );
        }

        var rawToken = CreateUrlSafeToken();
        var tokenHash = HashToken(rawToken);

        var existingPending = await _db.PendingRegistrations.FirstOrDefaultAsync(item =>
            item.Username == username
        );

        if (existingPending is not null)
        {
            existingPending.Email = email;
            existingPending.DisplayName = displayName;
            existingPending.Gender = normalizedGender;
            existingPending.PasswordHash = passwordHash;
            existingPending.TokenHash = tokenHash;
            existingPending.ExpiresAt = DateTime.UtcNow.Add(EmailVerificationTokenLifetime);
            existingPending.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.PendingRegistrations.Add(
                new PendingRegistration
                {
                    Username = username,
                    Email = email,
                    DisplayName = displayName,
                    Gender = normalizedGender,
                    PasswordHash = passwordHash,
                    TokenHash = tokenHash,
                    ExpiresAt = DateTime.UtcNow.Add(EmailVerificationTokenLifetime),
                    CreatedAt = DateTime.UtcNow,
                }
            );
        }

        await _db.SaveChangesAsync();

        var baseUrl = (_emailOptions.FrontendBaseUrl ?? "http://localhost:3000").TrimEnd('/');
        var verifyUrl = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(rawToken)}";

        var html = $"""
            <p>Hello {System.Net.WebUtility.HtmlEncode(displayName)},</p>
            <p>Confirm your Green Energy Monitor signup for username <strong>{System.Net.WebUtility.HtmlEncode(username)}</strong>.</p>
            <p><a href="{verifyUrl}">Verify email and create account</a></p>
            <p>This link expires in 24 hours. Your account is not created until you verify.</p>
            """;

        try
        {
            await _emailService.SendAsync(email, "Verify your Green Energy Monitor email", html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email for username {Username}.", username);

            var pendingToRemove = await _db.PendingRegistrations.FirstOrDefaultAsync(item =>
                item.Username == username
            );
            if (pendingToRemove is not null)
            {
                _db.PendingRegistrations.Remove(pendingToRemove);
                await _db.SaveChangesAsync();
            }

            throw new InvalidOperationException(
                LooksLikeInvalidRecipientError(ex)
                    ? "That email address is invalid or cannot receive mail. Check it and try again."
                    : "Could not send the verification email. Please try again in a moment.",
                ex
            );
        }

        return (
            null,
            $"Verification email sent to {email}. Open the link in that message to create your account."
        );
    }

    public async Task<AuthSession?> VerifyEmailAsync(string token)
    {
        token = token?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("Verification link is invalid or has expired.");
        }

        await CleanupExpiredPendingRegistrationsAsync();

        var tokenHash = HashToken(token);
        var pending = await _db.PendingRegistrations.FirstOrDefaultAsync(item =>
            item.TokenHash == tokenHash
        );

        if (pending is null || pending.ExpiresAt < DateTime.UtcNow)
        {
            throw new InvalidOperationException("Verification link is invalid or has expired.");
        }

        if (await _db.Users.AnyAsync(user => user.Username == pending.Username))
        {
            _db.PendingRegistrations.Remove(pending);
            await _db.SaveChangesAsync();
            throw new InvalidOperationException(
                "That username is already taken. Please register again with a different username."
            );
        }

        var user = new User
        {
            Username = pending.Username,
            Email = pending.Email,
            DisplayName = pending.DisplayName,
            Gender = pending.Gender,
            PasswordHash = pending.PasswordHash,
            Role = "Viewer",
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        _db.PendingRegistrations.Remove(pending);
        await _db.SaveChangesAsync();

        return await CreateSessionAsync(user);
    }

    public async Task<string> RequestPasswordResetAsync(
        string username,
        string email,
        string? newPassword = null,
        string? confirmPassword = null
    )
    {
        username = NormalizeUsername(username);
        email = NormalizeEmail(email);

        if (UseEmailBypass || !_emailService.IsConfigured)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email))
            {
                throw new InvalidOperationException("Username and email are required.");
            }

            if (string.IsNullOrEmpty(newPassword))
            {
                throw new InvalidOperationException("New password is required.");
            }

            if (newPassword != confirmPassword)
            {
                throw new InvalidOperationException("New passwords do not match.");
            }

            var user = await _db.Users.FirstOrDefaultAsync(item =>
                item.Username == username && item.Email == email
            );
            if (user is null)
            {
                throw new InvalidOperationException(
                    "No account matches that username and email."
                );
            }

            user.PasswordHash = _passwords.Hash(newPassword);
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresAt = null;
            await _db.SaveChangesAsync();

            _logger.LogWarning(
                "Password reset via identity bypass for user {UserId} (email sending skipped).",
                user.Id
            );

            return "Password updated. You can sign in with your new password.";
        }

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email))
        {
            return "If an account matches that username and email, we sent a password reset link.";
        }

        var matched = await _db.Users.FirstOrDefaultAsync(item =>
            item.Username == username && item.Email == email
        );
        if (matched is null)
        {
            return "If an account matches that username and email, we sent a password reset link.";
        }

        var rawToken = CreateUrlSafeToken();
        matched.PasswordResetTokenHash = HashToken(rawToken);
        matched.PasswordResetTokenExpiresAt = DateTime.UtcNow.Add(PasswordResetTokenLifetime);
        await _db.SaveChangesAsync();

        var baseUrl = (_emailOptions.FrontendBaseUrl ?? "http://localhost:3000").TrimEnd('/');
        var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

        var html = $"""
            <p>Hello {System.Net.WebUtility.HtmlEncode(matched.DisplayName)},</p>
            <p>We received a request to reset the Green Energy Monitor password for username <strong>{System.Net.WebUtility.HtmlEncode(matched.Username)}</strong>.</p>
            <p><a href="{resetUrl}">Reset your password</a></p>
            <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
            """;

        try
        {
            await _emailService.SendAsync(
                matched.Email,
                "Reset your Green Energy Monitor password",
                html
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email for user {UserId}.", matched.Id);
            throw new InvalidOperationException(
                "Could not send the reset email. Please try again in a moment.",
                ex
            );
        }

        return "If an account matches that username and email, we sent a password reset link.";
    }

    public async Task<(bool Ok, string? Error)> ResetPasswordAsync(string token, string newPassword)
    {
        token = token?.Trim() ?? "";
        newPassword = newPassword ?? "";

        if (string.IsNullOrWhiteSpace(token))
        {
            return (false, "Reset link is invalid or has expired.");
        }

        if (string.IsNullOrEmpty(newPassword))
        {
            return (false, "New password is required.");
        }

        var tokenHash = HashToken(token);
        var user = await _db.Users.FirstOrDefaultAsync(item =>
            item.PasswordResetTokenHash == tokenHash
        );

        if (
            user is null
            || user.PasswordResetTokenExpiresAt is null
            || user.PasswordResetTokenExpiresAt < DateTime.UtcNow
        )
        {
            return (false, "Reset link is invalid or has expired.");
        }

        user.PasswordHash = _passwords.Hash(newPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<AuthSession?> RefreshAsync(string? rawRefreshToken)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            return null;
        }

        var hash = HashToken(rawRefreshToken);
        var stored = await _db.RefreshTokens
            .Include(token => token.User)
            .FirstOrDefaultAsync(token => token.TokenHash == hash);

        if (stored is null || !stored.IsActive)
        {
            return null;
        }

        stored.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await CreateSessionAsync(stored.User);
    }

    public async Task RevokeRefreshTokenAsync(string? rawRefreshToken)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            return;
        }

        var hash = HashToken(rawRefreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(token => token.TokenHash == hash);
        if (stored is null || stored.RevokedAt is not null)
        {
            return;
        }

        stored.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public Task<User?> GetUserByIdAsync(int userId) =>
        _userRepository.GetUserByIdAsync(userId);

    public async Task<(AuthSession? Session, string? Error)> UpdateProfileAsync(
        int userId,
        UpdateProfileRequest request
    )
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

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return (null, "Display name is required.");
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

        return (await CreateSessionAsync(user), null);
    }

    public async Task<(bool Ok, string? Error)> ChangePasswordAsync(
        int userId,
        ChangePasswordRequest request
    )
    {
        var currentPassword = request.CurrentPassword ?? "";
        var newPassword = request.NewPassword ?? "";

        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return (false, "Account not found.");
        }

        if (!_passwords.Verify(currentPassword, user.PasswordHash))
        {
            return (false, "Current password is incorrect.");
        }

        if (string.IsNullOrEmpty(newPassword))
        {
            return (false, "New password is required.");
        }

        user.PasswordHash = _passwords.Hash(newPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
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

        if (user.Role == AdminRole || user.Username == AdminUsername)
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
            .OrderByDescending(user => user.Role == AdminRole)
            .ThenBy(user => user.Username)
            .Select(user => new AdminUserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Gender = user.Gender,
                IsAdmin = user.Role == AdminRole,
                CreatedAt = user.CreatedAt,
            })
            .ToListAsync();
    }

    public async Task<(AdminUserDto? User, string? Error)> AdminCreateUserAsync(
        AdminCreateUserRequest request
    )
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

        if (string.IsNullOrEmpty(password))
        {
            return (null, "Password is required.");
        }

        var gender = NormalizeGender(request.Gender) ?? "Other";

        if (await _userRepository.GetUserByUsernameAsync(username) is not null)
        {
            return (null, "That username is already taken.");
        }

        var user = new User
        {
            Username = username,
            Email = email,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? username : displayName,
            Gender = gender,
            PasswordHash = _passwords.Hash(password),
            Role = "Viewer",
            CreatedAt = DateTime.UtcNow,
        };

        await _userRepository.CreateUserAsync(user);
        return (ToAdminDto(user), null);
    }

    public async Task<(AdminUserDto? User, string? Error)> AdminUpdateUserAsync(
        int userId,
        AdminUpdateUserRequest request
    )
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

        if (user.Username == AdminUsername || user.Role == AdminRole)
        {
            // Keep admin username stable.
            username = user.Username;
        }

        user.Username = username;
        user.Email = email;
        user.DisplayName = string.IsNullOrWhiteSpace(displayName) ? user.DisplayName : displayName;
        user.Gender = gender;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwords.Hash(request.Password);
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

        if (user.Role == AdminRole || user.Username == AdminUsername)
        {
            return (false, "The admin account cannot be deleted.");
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    private static AdminUserDto ToAdminDto(User user) =>
        new()
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.DisplayName,
            Gender = user.Gender,
            IsAdmin = user.Role == AdminRole,
            CreatedAt = user.CreatedAt,
        };

    private async Task<AuthSession> CreateSessionAsync(User user)
    {
        var accessToken = GenerateAccessToken(user);
        var rawRefresh = GenerateRefreshToken();

        _db.RefreshTokens.Add(
            new RefreshToken
            {
                UserId = user.Id,
                TokenHash = HashToken(rawRefresh),
                ExpiresAt = DateTime.UtcNow.Add(RefreshTokenLifetime),
                CreatedAt = DateTime.UtcNow,
            }
        );
        await _db.SaveChangesAsync();

        return new AuthSession(accessToken, rawRefresh, user);
    }

    private string GenerateAccessToken(User user)
    {
        var secret =
            _configuration["JwtSettings:Secret"]
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? "green-energy-monitor-dev-jwt-key-change-me-32chars!";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.Add(AccessTokenLifetime),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private static string HashToken(string rawToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(hash);
    }

    private static string NormalizeEmail(string? email) =>
        (email ?? string.Empty).Trim().ToLowerInvariant();

    private static string NormalizeUsername(string? username) =>
        (username ?? string.Empty).Trim().ToLowerInvariant();

    private static string? ValidateUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return "Username is required.";
        }

        if (username.Length < 3 || username.Length > 32)
        {
            return "Username must be between 3 and 32 characters.";
        }

        foreach (var ch in username)
        {
            if (!(char.IsLetterOrDigit(ch) || ch is '_' or '.' or '-'))
            {
                return "Username can only contain letters, numbers, '.', '_' or '-'.";
            }
        }

        return null;
    }

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

    private static string CreateUrlSafeToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static bool LooksLikeInvalidRecipientError(Exception ex)
    {
        var message = (ex.Message ?? "").ToLowerInvariant();
        return message.Contains("mailbox")
            || message.Contains("recipient")
            || message.Contains("user unknown")
            || message.Contains("not found")
            || message.Contains("does not exist")
            || message.Contains("invalid or cannot receive");
    }
}
