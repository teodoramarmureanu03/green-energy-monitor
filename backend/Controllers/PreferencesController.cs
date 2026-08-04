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
    public async Task<IActionResult> GetTimezone([FromQuery] string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return BadRequest(new { Message = "clientId is required." });
        }

        var preference = await _preferencesService.GetTimezoneAsync(clientId);
        return preference is null ? NotFound() : Ok(preference);
    }

    [HttpPut("timezone")]
    public async Task<IActionResult> SaveTimezone([FromBody] ViewerTimezoneRequest request)
    {
        var (response, error) = await _preferencesService.SaveTimezoneAsync(request);

        if (error is not null)
        {
            return BadRequest(new { Message = error });
        }

        return Ok(response);
    }
}
