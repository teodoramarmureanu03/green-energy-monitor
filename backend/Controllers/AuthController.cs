using System.Security.Claims;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    public const string RefreshCookieName = "refresh_token";

    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var result = await _authService.RegisterAsync(
                request.Email,
                request.Password,
                request.ConfirmPassword
            );

            if (result is null)
            {
                return BadRequest(new { message = "Could not create account." });
            }

            SetRefreshCookie(result.RefreshToken);
            return Ok(ToResponse(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request.Email, request.Password);
        if (result is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        SetRefreshCookie(result.RefreshToken);
        return Ok(ToResponse(result));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var raw = Request.Cookies[RefreshCookieName];
        var result = await _authService.RefreshAsync(raw);
        if (result is null)
        {
            ClearRefreshCookie();
            return Unauthorized(new { message = "Session expired. Please sign in again." });
        }

        SetRefreshCookie(result.RefreshToken);
        return Ok(ToResponse(result));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var idValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(idValue, out var userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetUserByIdAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(new { email = user.Email, role = user.Role });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var raw = Request.Cookies[RefreshCookieName];
        await _authService.RevokeRefreshTokenAsync(raw);
        ClearRefreshCookie();
        Response.Cookies.Delete("jwt_token");
        return Ok(new { message = "Signed out." });
    }

    private static object ToResponse(AuthSession session) =>
        new
        {
            token = session.AccessToken,
            email = session.User.Email,
            role = session.User.Role,
            expiresInSeconds = (int)AuthService.AccessTokenLifetime.TotalSeconds,
        };

    private void SetRefreshCookie(string refreshToken)
    {
        Response.Cookies.Append(
            RefreshCookieName,
            refreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                // None + Secure so cross-origin localhost:3000 → :5000 still sends the cookie.
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/api/auth",
                Expires = DateTime.UtcNow.Add(AuthService.RefreshTokenLifetime),
            }
        );
    }

    private void ClearRefreshCookie()
    {
        Response.Cookies.Delete(
            RefreshCookieName,
            new CookieOptions
            {
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/api/auth",
            }
        );
    }
}
