using backend;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/history")]
public class HistoryController : ControllerBase
{
    private readonly HistoryService _historyService;

    public HistoryController(HistoryService historyService)
    {
        _historyService = historyService;
    }

    [HttpGet("{iso}")]
    public async Task<IActionResult> GetHistory(
        string iso,
        [FromQuery] string period = "week",
        [FromQuery] string? timeZone = null)
    {
        iso = iso.ToUpperInvariant();

        if (!CountryCatalog.IsKnown(iso))
        {
            return NotFound(new { Message = $"Unknown country: {iso}." });
        }

        var historyData = await _historyService.GetHistoryAsync(new HistoryRequest
        {
            Iso = iso,
            Period = period,
            TimeZone = timeZone,
        });

        return Ok(historyData);
    }
}
