using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Services;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/generation")]
public class GenerationController : ControllerBase
{
    private readonly EntsoeService _entsoeService;
    private readonly EnergyDbContext _db;

    public GenerationController(EntsoeService entsoeService, EnergyDbContext db)
    {
        _entsoeService = entsoeService;
        _db = db;
    }

    // 1. Endpoint pentru Backfill (Descărcare date de la ENTSO-E)
    [HttpPost("backfill/{iso}")]
    public async Task<IActionResult> HandleBackfill(string iso, [FromQuery] int days)
    {
        // Plasa de siguranță: mergem de acum X zile (ora 00:00) până mâine la 23:59
        DateTime start = DateTime.UtcNow.AddDays(-days).Date;
        DateTime end = DateTime.UtcNow;

        try
        {
            await _entsoeService.BackfillHistoryAsync(iso, start, end);
            return Ok(new { Message = $"Backfill pornit și procesat cu succes pentru {iso.ToUpper()} pentru ultimele {days} zile." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"A apărut o eroare la procesarea datelor ENTSO-E: {ex.Message}" });
        }
    }

    // 2. Endpoint pentru Producția Live curentă
    [HttpGet("live/{iso}")]
    public async Task<IActionResult> GetLiveGeneration(string iso)
    {
        try
        {
            // Căutăm cea mai recentă înregistrare salvată în baza de date pentru această țară
            var latestRecord = await _db.GenerationRecords
                .Where(r => r.CountryIso == iso.ToUpper())
                .OrderByDescending(r => r.Timestamp)
                .FirstOrDefaultAsync();

            if (latestRecord == null)
            {
                return NotFound(new { Message = $"Nu s-au găsit date recente de generare pentru țara {iso.ToUpper()}. Rulează mai întâi un backfill." });
            }

            // Luăm toate înregistrările din acea ultimă oră disponibilă ca să avem tabelul complet
            var liveData = await _db.GenerationRecords
                .Where(r => r.CountryIso == iso.ToUpper() && r.Timestamp == latestRecord.Timestamp)
                .ToListAsync();

            return Ok(liveData);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"Eroare la preluarea datelor live: {ex.Message}" });
        }
    }

    // 3. Endpoint pentru lista de țări configurate (util în frontend pentru Dropdown)
    [HttpGet("countries")]
    public async Task<IActionResult> GetConfiguredCountries()
    {
        try
        {
            var countries = await _db.CountryZones
                .Select(c => new { c.IsoCode, c.ZoneCode })
                .Distinct()
                .ToListAsync();

            return Ok(countries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = $"Eroare la preluarea listei de țări: {ex.Message}" });
        }
    }
}