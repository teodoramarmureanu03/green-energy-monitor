using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public class AuthService
{
    public const string AdminEmail = "admin@gmail.com";
    public const string AdminDisplayName = "Admin";
    public const string AdminPassword = "admin";
    public const string AdminRole = "Admin";

    private readonly EnergyDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(EnergyDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task EnsureAdminUserAsync()
    {
        var admin = await _db.Users.FirstOrDefaultAsync(user => user.Email == AdminEmail);
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword);

        if (admin is null)
        {
            _db.Users.Add(new AppUser
            {
                Email = AdminEmail,
                DisplayName = AdminDisplayName,
                Gender = "Other",
                PasswordHash = passwordHash,
                IsAdmin = true,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            admin.DisplayName = AdminDisplayName;
            admin.IsAdmin = true;
            admin.PasswordHash = passwordHash;
            if (string.IsNullOrWhiteSpace(admin.Gender))
            {
                admin.Gender = "Other";
            }
        }

        await _db.SaveChangesAsync();
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

        if (email == AdminEmail)
        {
            return (null, "This email is reserved for the admin account.");
        }

        var gender = NormalizeGender(request.Gender);
        if (gender is null)
        {
            return (null, "Select male, female, or other.");
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
            IsAdmin = false,
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

        if (string.IsNullOrWhiteSpace(email))
        {
            return (null, "Email is required.");
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

        user.DisplayName = user.IsAdmin ? AdminDisplayName : displayName;
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

    public async Task<(bool Ok, string? Error)> DeleteAccountAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null)
        {
            return (false, "Account not found.");
        }

        if (user.IsAdmin || user.Email == AdminEmail)
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
            .ThenBy(user => user.Email)
            .Select(user => new AdminUserDto
            {
                Id = user.Id,
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
        var email = NormalizeEmail(request.Email);
        var displayName = request.DisplayName?.Trim() ?? "";
        var password = request.Password ?? "";

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return (null, "Enter a valid email address.");
        }

        if (email == AdminEmail)
        {
            return (null, "This email is reserved for the admin account.");
        }

        var gender = NormalizeGender(request.Gender) ?? "Other";

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

        var email = NormalizeEmail(request.Email);
        var displayName = request.DisplayName?.Trim() ?? "";
        var gender = NormalizeGender(request.Gender) ?? user.Gender;

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return (null, "Enter a valid email address.");
        }

        if (user.IsAdmin || user.Email == AdminEmail)
        {
            // Keep the reserved admin identity stable.
            user.Email = AdminEmail;
            user.DisplayName = AdminDisplayName;
            user.IsAdmin = true;
            user.Gender = gender;
        }
        else
        {
            if (email == AdminEmail)
            {
                return (null, "This email is reserved for the admin account.");
            }

            var emailTaken = await _db.Users.AnyAsync(item =>
                item.Email == email && item.Id != userId);
            if (emailTaken)
            {
                return (null, "An account with this email already exists.");
            }

            user.Email = email;
            user.DisplayName = displayName;
            user.Gender = gender;
        }

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

        if (user.IsAdmin || user.Email == AdminEmail)
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
            Email = user.Email,
            DisplayName = user.DisplayName,
            Gender = user.Gender,
            IsAdmin = user.IsAdmin,
        };

    private static AdminUserDto ToAdminDto(AppUser user) =>
        new()
        {
            Id = user.Id,
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
}
