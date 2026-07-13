using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/history")]
public class HistoryController : ControllerBase
{
    private readonly GenerationService _generationService;

    public HistoryController(GenerationService generationService)
    {
        _generationService = generationService;
    }

    // Endpoint principal care întoarce istoricul gata calculat pentru frontend
    [HttpGet("{iso}")]
    public async Task<IActionResult> GetHistory(string iso, [FromQuery] string period = "week")
    {
        if (string.IsNullOrWhiteSpace(iso))
        {
            return BadRequest(new { Error = "Codul ISO al țării este obligatoriu." });
        }

        try
        {
            // Apelează serviciul tău existent care știe să adune megawații,
            // să calculeze procentele de RenewablePct și să le organizeze în formatul Dto
            var historyData = await _generationService.GetHistoryAsync(iso.ToUpper(), period);

            if (historyData == null)
            {
                return NotFound(new { Message = $"Nu există date istorice pentru {iso.ToUpper()} în perioada specificată ({period})." });
            }

            return Ok(historyData);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"A apărut o eroare la calcularea istoricului: {ex.Message}" });
        }
    }
}