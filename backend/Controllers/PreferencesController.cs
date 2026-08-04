using System.Security.Claims;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/preferences")]
public class PreferencesController : ControllerBase
{
    private readonly PreferencesService _preferencesService;

    public PreferencesController(PreferencesService preferencesService)
    {
        _preferencesService = preferencesService;
    }

    [HttpGet("timezone")]
    public async Task<IActionResult> GetTimezone()
    {
        var ownerKey = GetOwnerKey();
        if (ownerKey is null)
        {
            return Unauthorized();
        }

        var preference = await _preferencesService.GetTimezoneAsync(ownerKey);
        return preference is null ? NotFound() : Ok(preference);
    }

    [HttpPut("timezone")]
    public async Task<IActionResult> SaveTimezone([FromBody] ViewerTimezoneRequest request)
    {
        var ownerKey = GetOwnerKey();
        if (ownerKey is null)
        {
            return Unauthorized();
        }

        // Ignore client-supplied clientId — preferences are bound to the JWT user.
        request.ClientId = ownerKey;

        var (response, error) = await _preferencesService.SaveTimezoneAsync(request);

        if (error is not null)
        {
            return BadRequest(new { Message = error });
        }

        return Ok(response);
    }

    private string? GetOwnerKey()
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name;
        if (!string.IsNullOrWhiteSpace(username))
        {
            return username.Trim().ToLowerInvariant();
        }

        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return string.IsNullOrWhiteSpace(userId) ? null : $"user:{userId.Trim()}";
    }
}
