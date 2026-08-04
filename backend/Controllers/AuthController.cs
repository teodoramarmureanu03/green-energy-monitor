using System.Security.Claims;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/auth")]
[ApiController]
[Authorize]
public class AuthController : ControllerBase
{
    public const string RefreshCookieName = "refresh_token";

    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var (session, message) = await _authService.RegisterAsync(
                request.Username,
                request.Email,
                request.DisplayName,
                request.Gender,
                request.Password,
                request.ConfirmPassword
            );

            if (session is not null)
            {
                SetRefreshCookie(session.RefreshToken);
                return Ok(ToResponse(session));
            }

            return Ok(
                new
                {
                    message = message
                        ?? "Verification email sent. Open the link in that message to create your account.",
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            var result = await _authService.VerifyEmailAsync(request.Token);
            if (result is null)
            {
                return BadRequest(new { message = "Could not verify email." });
            }

            SetRefreshCookie(result.RefreshToken);
            return Ok(ToResponse(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            var message = await _authService.RequestPasswordResetAsync(
                request.Username,
                request.Email,
                request.NewPassword,
                request.ConfirmPassword
            );
            return Ok(new { message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var (ok, error) = await _authService.ResetPasswordAsync(
            request.Token,
            request.NewPassword
        );
        if (!ok)
        {
            return BadRequest(new { message = error });
        }

        return Ok(new { message = "Password updated. You can sign in with your new password." });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request.Username, request.Password);
        if (result is null)
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        SetRefreshCookie(result.RefreshToken);
        return Ok(ToResponse(result));
    }

    [AllowAnonymous]
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

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetUserByIdAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(
            new
            {
                username = user.Username,
                email = user.Email,
                displayName = user.DisplayName,
                gender = user.Gender,
                role = user.Role,
            }
        );
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var (session, error) = await _authService.UpdateProfileAsync(userId, request);
        if (error is not null || session is null)
        {
            return BadRequest(new { message = error ?? "Could not update profile." });
        }

        SetRefreshCookie(session.RefreshToken);
        return Ok(ToResponse(session));
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var (ok, error) = await _authService.ChangePasswordAsync(userId, request);
        if (!ok)
        {
            return BadRequest(new { message = error });
        }

        return Ok(new { message = "Password updated." });
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteAccount()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var (ok, error) = await _authService.DeleteAccountAsync(userId);
        if (!ok)
        {
            return BadRequest(new { message = error });
        }

        ClearRefreshCookie();
        return Ok(new { message = "Account deleted." });
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var raw = Request.Cookies[RefreshCookieName];
        await _authService.RevokeRefreshTokenAsync(raw);
        ClearRefreshCookie();
        Response.Cookies.Delete("jwt_token");
        return Ok(new { message = "Signed out." });
    }

    private bool TryGetUserId(out int userId)
    {
        var idValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(idValue, out userId);
    }

    private static object ToResponse(AuthSession session) =>
        new
        {
            token = session.AccessToken,
            username = session.User.Username,
            email = session.User.Email,
            displayName = session.User.DisplayName,
            gender = session.User.Gender,
            role = session.User.Role,
            expiresInSeconds = (int)AuthService.AccessTokenLifetime.TotalSeconds,
        };

    private void SetRefreshCookie(string refreshToken)
    {
        var secure = HttpContext.Request.IsHttps;
        // Session cookie (no Expires/Max-Age): removed when the browser closes.
        Response.Cookies.Append(
            RefreshCookieName,
            refreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = secure ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/api/auth",
            }
        );
    }

    private void ClearRefreshCookie()
    {
        var secure = HttpContext.Request.IsHttps;
        Response.Cookies.Delete(
            RefreshCookieName,
            new CookieOptions
            {
                Secure = secure,
                SameSite = secure ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/api/auth",
            }
        );
    }
}
