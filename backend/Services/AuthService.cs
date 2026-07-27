using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public class AuthService
{
    private static readonly TimeSpan PasswordResetTokenLifetime = TimeSpan.FromHours(1);

    public const string AdminEmail = "admin@gmail.com";
    public const string AdminUsername = "admin";
    public const string AdminDisplayName = "Admin";
    public const string AdminPassword = "admin";
    public const string AdminRole = "Admin";

    private readonly EnergyDbContext _db;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly EmailOptions _emailOptions;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        EnergyDbContext db,
        IConfiguration config,
        IEmailService emailService,
        IOptions<EmailOptions> emailOptions,
        ILogger<AuthService> logger)
    {
        _db = db;
        _config = config;
        _emailService = emailService;
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

    public async Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
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

        var gender = NormalizeGender(request.Gender);
        if (gender is null)
        {
            return (null, "Select male, female, or other.");
        }

        var usernameTaken = await _db.Users.AnyAsync(user => user.Username == username);
        if (usernameTaken)
        {
            return (null, "That username is already taken.");
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

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        user.PasswordResetTokenHash = HashResetToken(rawToken);
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
                "Could not send the reset email. Check SMTP settings in .env (Gmail + App Password).",
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

        var tokenHash = HashResetToken(token);
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

    private static string HashResetToken(string rawToken)
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
