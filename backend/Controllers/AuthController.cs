using System.Security.Claims;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (message, error) = await _authService.RegisterAsync(request);

        if (error is not null)
        {
            return BadRequest(new { Message = error });
        }

        return Ok(new { Message = message });
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var (response, error) = await _authService.VerifyEmailAsync(request);

        if (error is not null)
        {
            return BadRequest(new { Message = error });
        }

        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (response, error) = await _authService.LoginAsync(request);

        if (error is not null)
        {
            return Unauthorized(new { Message = error });
        }

        return Ok(response);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            await _authService.RequestPasswordResetAsync(request);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { Message = ex.Message });
        }

        // Same message whether or not the account exists (avoids account enumeration).
        return Ok(new
        {
            Message = "If an account matches that username and email, we sent a password reset link.",
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var (ok, error) = await _authService.ResetPasswordAsync(request);
        if (!ok)
        {
            return BadRequest(new { Message = error });
        }

        return Ok(new { Message = "Password updated. You can sign in with your new password." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetUserAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(user);
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var (response, error) = await _authService.UpdateProfileAsync(userId, request);
        if (error is not null)
        {
            return error == "Account not found."
                ? NotFound(new { Message = error })
                : BadRequest(new { Message = error });
        }

        return Ok(response);
    }

    [Authorize]
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
            return error == "Account not found."
                ? NotFound(new { Message = error })
                : BadRequest(new { Message = error });
        }

        return Ok(new { Message = "Password updated." });
    }

    [Authorize]
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteAccount()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var deleted = await _authService.DeleteAccountAsync(userId);
        if (!deleted.Ok)
        {
            return deleted.Error == "Account not found."
                ? NotFound(new { Message = deleted.Error })
                : BadRequest(new { Message = deleted.Error });
        }

        return NoContent();
    }

    private bool TryGetUserId(out int userId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return int.TryParse(userIdValue, out userId);
    }
}
