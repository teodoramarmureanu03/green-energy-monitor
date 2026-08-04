using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public interface IAuthService
{
    Task<AuthSession?> LoginAsync(string email, string password);
    Task<AuthSession?> RegisterAsync(string email, string password, string confirmPassword);
    Task<AuthSession?> RefreshAsync(string? rawRefreshToken);
    Task RevokeRefreshTokenAsync(string? rawRefreshToken);
    Task<User?> GetUserByIdAsync(int userId);
}

public record AuthSession(string AccessToken, string RefreshToken, User User);

public class AuthService : IAuthService
{
    public static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

    private readonly IUserRepository _userRepository;
    private readonly EnergyDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository userRepository,
        EnergyDbContext db,
        IConfiguration configuration
    )
    {
        _userRepository = userRepository;
        _db = db;
        _configuration = configuration;
    }

    public async Task<AuthSession?> LoginAsync(string email, string password)
    {
        email = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var user = await _userRepository.GetUserByEmailAsync(email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return null;
        }

        return await CreateSessionAsync(user);
    }

    public async Task<AuthSession?> RegisterAsync(
        string email,
        string password,
        string confirmPassword
    )
    {
        email = NormalizeEmail(email);
        password = password?.Trim() ?? "";
        confirmPassword = confirmPassword?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            throw new InvalidOperationException("Enter a valid email address.");
        }

        if (password.Length < 6)
        {
            throw new InvalidOperationException("Password must be at least 6 characters.");
        }

        if (password != confirmPassword)
        {
            throw new InvalidOperationException("Passwords do not match.");
        }

        var existing = await _userRepository.GetUserByEmailAsync(email);
        if (existing is not null)
        {
            throw new InvalidOperationException("An account with this email already exists.");
        }

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = "Viewer",
            CreatedAt = DateTime.UtcNow,
        };

        await _userRepository.CreateUserAsync(user);
        return await CreateSessionAsync(user);
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

        // Rotate: revoke old refresh, issue a new pair.
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
}
