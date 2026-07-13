using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Services;

public class GenerationService
{
    private readonly EnergyDbContext _db;

    public GenerationService(EnergyDbContext db)
    {
        _db = db;
    }

    public async Task<List<HistoryDto>> GetHistoryAsync(string iso, string period)
    {
        var p = period.ToLower();
        DateTime limitDate = DateTime.UtcNow;

        if (p == "week")
        {
            limitDate = DateTime.UtcNow.AddDays(-7);
        }
        else if (p == "month")
        {
            limitDate = DateTime.UtcNow.AddDays(-30);
        }
        else if (p == "year")
        {
            limitDate = DateTime.UtcNow.AddDays(-365);
        }

        // Presupunem că aici ai interogarea inițială din baza de date
        var rawHistory = await _db.GenerationRecords
            .Where(r => r.CountryIso == iso.ToUpper() && r.Timestamp >= limitDate)
            .ToListAsync();

        // 3. Matematica: Dacă vrea lună sau an -> Grupăm pe ZILE. Dacă vrea săptămână -> Grupăm pe ORE
        if (p == "month" || p == "year")
        {
            return rawHistory
                .GroupBy(r => r.FetchedAt.Date)
                .Select(BuildHistoryDto) // <--- Apelul curat către metoda extrasă!
                .ToList();
        }
        else // implicit "week" sau altceva
        {
            // Dacă pentru week gruparea se făcea tot pe dată/oră, refolosim aceeași metodă extrasă
            return rawHistory
                .GroupBy(r => r.FetchedAt) 
                .Select(BuildHistoryDto) // <--- Refolosire completă, adio duplicare!
                .ToList();
        }
    }

    // =========================================================================
    // METODA EXTRASĂ REUTILIZABILĂ (Cerută de mentor pentru a elimina duplicarea)
    // =========================================================================
    private HistoryDto BuildHistoryDto(IGrouping<DateTime, GenerationRecord> g)
    {
        var toateSurseleDinZi = g.SelectMany(r =>
            JsonSerializer.Deserialize<List<SourceBreakdown>>(r.BySourceJson) ?? new List<SourceBreakdown>()
        );

        var surseMediate = toateSurseleDinZi
            .GroupBy(s => s.Source)
            .Select(sg => new SourceBreakdown
            {
                Source = sg.Key,
                Renewable = sg.First().Renewable,
                ValueMw = Math.Round(sg.Average(s => s.ValueMw), 1)
            }).ToList();

        return new HistoryDto
        {
            Date = g.Key.ToString("yyyy-MM-dd HH:mm"), // Format flexibil pentru grupări
            Total = Math.Round(g.Average(r => r.Total), 1),
            RenewableMw = Math.Round(g.Average(r => r.RenewableMw), 1),
            RenewablePct = Math.Round(g.Average(r => r.RenewablePct), 1),
            BySourceJson = JsonSerializer.Serialize(surseMediate)
        };
    }
}