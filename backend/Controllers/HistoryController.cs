using backend;
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
    public async Task<IActionResult> GetHistory(string iso, [FromQuery] string period = "week")
    {
        iso = iso.ToUpperInvariant();

        if (!CountryCatalog.IsKnown(iso))
        {
            return NotFound(new { Message = $"Unknown country: {iso}." });
        }

        var historyData = await _historyService.GetHistoryAsync(iso, period);
        return Ok(historyData);
    }
}
