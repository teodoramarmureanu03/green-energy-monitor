using backend;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/generation")]
public class GenerationController : ControllerBase
{
    private readonly EntsoeService _entsoeService;
    private readonly EnergyDbContext _db;

    public GenerationController(
        EntsoeService entsoeService,
        EnergyDbContext db
    )
    {
        _entsoeService = entsoeService;
        _db = db;
    }

    [HttpGet("{iso}")]
    public async Task<IActionResult> GetGeneration(string iso)
    {
        iso = iso.ToUpper();

        if (!CountryCatalog.Names.ContainsKey(iso))
        {
            return NotFound(
                new { Message = $"Unknown country: {iso}" }
            );
        }

        var data = await _entsoeService.GetFromDatabaseAsync(
            iso,
            _db
        );

        if (data == null)
        {
            return NotFound(
                new
                {
                    Message =
                        $"No data available yet for {iso}. " +
                        "Background sync is still in progress."
                }
            );
        }

        return Ok(data);
    }
}
