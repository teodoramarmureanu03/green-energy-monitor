using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class GenerationRepository : IGenerationRepository
{
    private readonly EnergyDbContext _db;

    public GenerationRepository(EnergyDbContext db)
    {
        _db = db;
    }

    public async Task<List<GenerationRecord>> GetRawHistoryAsync(string iso, DateTime startDate)
    {
        // Tot ce face e să dea un SELECT din baza de date
        return await _db.GenerationRecords
            .Where(r => r.IsoCode == iso && r.FetchedAt >= startDate)
            .OrderBy(r => r.FetchedAt)
            .ToListAsync();
    }
}