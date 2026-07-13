using System.Text.Json;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class GenerationService : IGenerationService
{
    private readonly IGenerationRepository _repo;

    // Injectăm Magazionerul! Bucătarul nu merge singur în cămară.
    public GenerationService(IGenerationRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<HistoryDto>> GetHistoryCalculatedAsync(string iso, string period)
    {
        // 1. Calculăm limitele de timp
        DateTime timeLimit = DateTime.UtcNow.AddDays(-7);
        string p = string.IsNullOrEmpty(period) ? "week" : period.ToLower();

        if (p == "month") timeLimit = DateTime.UtcNow.AddDays(-30);
        else if (p == "year") timeLimit = DateTime.UtcNow.AddDays(-365);

        // 2. Cerem datele brute de la Repository
        var rawHistory = await _repo.GetRawHistoryAsync(iso, timeLimit);

        // 3. Matematica: Dacă vrea lună sau an -> Grupăm pe ZILE
        if (p == "month" || p == "year")
        {
            return rawHistory
                .GroupBy(r => r.FetchedAt.Date)
                .Select(g => 
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
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        Total = Math.Round(g.Average(r => r.Total), 1),
                        RenewableMw = Math.Round(g.Average(r => r.RenewableMw), 1),
                        RenewablePct = Math.Round(g.Average(r => r.RenewablePct), 1),
                        BySourceJson = JsonSerializer.Serialize(surseMediate)
                    };
                }).ToList();
        }

        // 4. Matematica: Dacă vrea săptămână ("week") -> Grupăm pe ORĂ
        return rawHistory
            .GroupBy(r => new DateTime(r.FetchedAt.Year, r.FetchedAt.Month, r.FetchedAt.Day, r.FetchedAt.Hour, 0, 0))
            .Select(g => 
            {
                var toateSurseleDinOra = g.SelectMany(r => 
                    JsonSerializer.Deserialize<List<SourceBreakdown>>(r.BySourceJson) ?? new List<SourceBreakdown>()
                );

                var surseMediate = toateSurseleDinOra
                    .GroupBy(s => s.Source)
                    .Select(sg => new SourceBreakdown 
                    {
                        Source = sg.Key,
                        Renewable = sg.First().Renewable,
                        ValueMw = Math.Round(sg.Average(s => s.ValueMw), 1)
                    }).ToList();

                return new HistoryDto
                {
                    Date = g.Key.ToString("yyyy-MM-dd HH:mm"),
                    Total = Math.Round(g.Average(r => r.Total), 1),
                    RenewableMw = Math.Round(g.Average(r => r.RenewableMw), 1),
                    RenewablePct = Math.Round(g.Average(r => r.RenewablePct), 1),
                    BySourceJson = JsonSerializer.Serialize(surseMediate)
                };
            }).ToList();
    }
}