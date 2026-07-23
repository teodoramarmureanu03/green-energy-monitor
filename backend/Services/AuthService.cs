using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public class AuthService
{
    private readonly EnergyDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(EnergyDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
    {
        var email = NormalizeEmail(request.Email);
        var displayName = request.DisplayName?.Trim() ?? "";
        var password = request.Password ?? "";

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return (null, "Enter a valid email address.");
        }

        if (displayName.Length < 2)
        {
            return (null, "Display name must be at least 2 characters.");
        }

        if (password.Length < 6)
        {
            return (null, "Password must be at least 6 characters.");
        }

        var gender = NormalizeGender(request.Gender);
        if (gender is null)
        {
            return (null, "Select male or female.");
        }

        var exists = await _db.Users.AnyAsync(user => user.Email == email);
        if (exists)
        {
            return (null, "An account with this email already exists.");
        }

        var user = new AppUser
        {
            Email = email,
            DisplayName = displayName,
            Gender = gender,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return (BuildAuthResponse(user), null);
    }

    public async Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request)
    {
        var email = NormalizeEmail(request.Email);
        var password = request.Password ?? "";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return (null, "Email and password are required.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(item => item.Email == email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return (null, "Invalid email or password.");
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

    public async Task<(AuthUserDto? User, string? Error)> UpdateProfileAsync(
        int userId,
        UpdateProfileRequest request)
    {
        var displayName = request.DisplayName?.Trim() ?? "";
        if (displayName.Length < 2)
        {
            return (null, "Display name must be at least 2 characters.");
        }

        var gender = NormalizeGender(request.Gender);
        if (gender is null)
        {
            return (null, "Select male or female.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return (null, "Account not found.");
        }

        user.DisplayName = displayName;
        user.Gender = gender;
        await _db.SaveChangesAsync();

        return (ToDto(user), null);
    }

    public async Task<(bool Ok, string? Error)> ChangePasswordAsync(
        int userId,
        ChangePasswordRequest request)
    {
        var currentPassword = request.CurrentPassword ?? "";
        var newPassword = request.NewPassword ?? "";

        if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword))
        {
            return (false, "Current and new passwords are required.");
        }

        if (newPassword.Length < 6)
        {
            return (false, "New password must be at least 6 characters.");
        }

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
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<bool> DeleteAccountAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return false;
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return true;
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

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        };

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
            Email = user.Email,
            DisplayName = user.DisplayName,
            Gender = user.Gender,
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

        return null;
    }

    private static string NormalizeEmail(string? email) =>
        (email ?? "").Trim().ToLowerInvariant();
}
