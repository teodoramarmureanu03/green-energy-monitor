using backend;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/generation/history")]
public class HistoryController : ControllerBase
{
    private readonly EnergyDbContext _db;

    public HistoryController(EnergyDbContext db)
    {
        _db = db;
    }

    [HttpGet("{iso}")]
    public async Task<IActionResult> GetHistory(
        string iso,
        [FromQuery] string? period
    )
    {
        iso = iso.ToUpper();

        if (!CountryCatalog.Names.ContainsKey(iso))
        {
            return NotFound(
                new { Message = $"Unknown country: {iso}" }
            );
        }

        var periodType =
            period?.ToLower() switch
            {
                "month" => "Week",
                "year" => "Month",
                _ => "Day"
            };

        var limit = periodType switch
        {
            "Day" => 7,
            "Week" => 5,
            "Month" => 12,
            _ => 7
        };

        var history =
            await _db.GenerationChartPoints
                .AsNoTracking()
                .Where(point =>
                    point.IsoCode == iso &&
                    point.PeriodType == periodType
                )
                .OrderByDescending(
                    point => point.PeriodStart
                )
                .Take(limit)
                .OrderBy(point => point.PeriodStart)
                .Select(point => new
                {
                    Date = point.PeriodStart
                        .ToString("yyyy-MM-dd"),
                    point.Total,
                    point.RenewableMw,
                    point.RenewablePct,
                    point.WindMw,
                    point.SolarMw
                })
                .ToListAsync();

        return Ok(history);
    }
}
