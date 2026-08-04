using backend;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/generation")]
public class GenerationController : ControllerBase
{
    private readonly GenerationService _generationService;

    public GenerationController(GenerationService generationService)
    {
        _generationService = generationService;
    }

    [HttpGet("{iso}")]
    public async Task<IActionResult> GetLiveGeneration(string iso)
    {
        var liveData = await _generationService.GetLiveGenerationAsync(iso);

        if (liveData is null)
        {
            return NotFound(new { Message = $"No recent data for {iso.ToUpper()}." });
        }

        return Ok(liveData);
    }

    [HttpGet("countries")]
    public async Task<IActionResult> GetConfiguredCountries()
    {
        var countries = await _generationService.GetCountriesAsync();
        return Ok(countries);
    }

    /// <summary>Manual ENTSO-E backfill — admin only (expensive upstream calls).</summary>
    [Authorize(Roles = AuthService.AdminRole)]
    [HttpPost("backfill/{iso}")]
    public async Task<IActionResult> HandleBackfill(string iso, CancellationToken cancellationToken)
    {
        iso = iso.ToUpperInvariant();

        if (!CountryCatalog.IsKnown(iso))
        {
            return NotFound(new { Message = $"Unknown country: {iso}." });
        }

        try
        {
            var entsoeService = HttpContext.RequestServices.GetRequiredService<EntsoeService>();

            await entsoeService.RefreshCountryDataAsync(
                iso,
                CountryCatalog.GetDisplayName(iso),
                cancellationToken);

            return Ok(new { Message = $"Backfill complete for {iso}." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }
}
