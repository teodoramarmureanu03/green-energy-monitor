using backend;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/generation")]
public class GenerationController : ControllerBase
{
    private readonly GenerationService _generationService;
    private readonly EntsoeService _entsoeService;

    public GenerationController(
        GenerationService generationService,
        EntsoeService entsoeService)
    {
        _generationService = generationService;
        _entsoeService = entsoeService;
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
            await _entsoeService.RefreshCountryDataAsync(
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
