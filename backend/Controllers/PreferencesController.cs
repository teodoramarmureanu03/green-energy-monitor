using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

public class ViewerTimezoneRequest
{
    public string ClientId { get; set; } = "";
    public string CountryIso { get; set; } = "";
    public string TimeZone { get; set; } = "";
}

public class ViewerTimezoneResponse
{
    public string ClientId { get; set; } = "";
    public string CountryIso { get; set; } = "";
    public string TimeZone { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}

[ApiController]
[Route("api/preferences")]
public class PreferencesController : ControllerBase
{
    private readonly EnergyDbContext _db;

    public PreferencesController(EnergyDbContext db)
    {
        _db = db;
    }

    [HttpGet("timezone")]
    public async Task<IActionResult> GetTimezone([FromQuery] string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return BadRequest(new { Message = "clientId is required." });
        }

        var preference = await _db.ViewerTimezonePreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.ClientId == clientId);

        if (preference is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(preference));
    }

    [HttpPut("timezone")]
    public async Task<IActionResult> SaveTimezone([FromBody] ViewerTimezoneRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ClientId) ||
            string.IsNullOrWhiteSpace(request.CountryIso) ||
            string.IsNullOrWhiteSpace(request.TimeZone))
        {
            return BadRequest(new
            {
                Message = "clientId, countryIso, and timeZone are required.",
            });
        }

        try
        {
            _ = TimeZoneInfo.FindSystemTimeZoneById(request.TimeZone);
        }
        catch (TimeZoneNotFoundException)
        {
            // Linux containers use IANA ids; Windows may need conversion.
            // Accept common IANA ids even when FindSystemTimeZoneById fails on Windows.
            if (!request.TimeZone.Contains('/'))
            {
                return BadRequest(new { Message = $"Unknown time zone: {request.TimeZone}." });
            }
        }

        var iso = request.CountryIso.Trim().ToUpperInvariant();
        var clientId = request.ClientId.Trim();
        var timeZone = request.TimeZone.Trim();

        var preference = await _db.ViewerTimezonePreferences
            .FirstOrDefaultAsync(item => item.ClientId == clientId);

        if (preference is null)
        {
            preference = new ViewerTimezonePreference
            {
                ClientId = clientId,
            };
            _db.ViewerTimezonePreferences.Add(preference);
        }

        preference.CountryIso = iso;
        preference.TimeZone = timeZone;
        preference.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ToResponse(preference));
    }

    private static ViewerTimezoneResponse ToResponse(ViewerTimezonePreference preference) =>
        new()
        {
            ClientId = preference.ClientId,
            CountryIso = preference.CountryIso,
            TimeZone = preference.TimeZone,
            UpdatedAt = preference.UpdatedAt,
        };
}
