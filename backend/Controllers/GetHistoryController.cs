using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/generation")]
public class GetHistoryController : ControllerBase
{
    private readonly IGenerationService _service;

    public GetHistoryController(IGenerationService service)
    {
        _service = service;
    }

    // Răspunde doar la GET /api/generation/history/{iso}
    [HttpGet("history/{iso}")]
    public async Task<IActionResult> HandleAsync(string iso, [FromQuery] string? period)
    {
        var history = await _service.GetHistoryCalculatedAsync(iso.ToUpper(), period);
        return Ok(history);
    }
}