using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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

    public async Task<GenerationRecord?> GetLatestRecordAsync(string iso)
    {
        return await _db.GenerationRecords
            .AsNoTracking()
            .Where(record => record.IsoCode == iso.ToUpper())
            .OrderByDescending(record => record.FetchedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<CountryZone>> GetConfiguredCountriesAsync()
    {
        return await _db.CountryZones
            .AsNoTracking()
            .Select(zone => new CountryZone
            {
                IsoCode = zone.IsoCode,
                ZoneCode = zone.ZoneCode,
            })
            .Distinct()
            .ToListAsync();
    }

    public async Task<IReadOnlyList<string>> GetZoneCodesAsync(string iso)
    {
        return await _db.CountryZones
            .AsNoTracking()
            .Where(zone => zone.IsoCode == iso.ToUpper())
            .Select(zone => zone.ZoneCode)
            .ToListAsync();
    }

    public async Task<Dictionary<string, (string Name, bool Renewable)>> GetEnergySourceMapAsync()
    {
        var sources = await _db.EnergySources.AsNoTracking().ToListAsync();

        return sources.ToDictionary(
            source => source.Code,
            source => (source.Name, source.IsRenewable)
        );
    }

    public async Task AddRecordAsync(
        GenerationRecord record,
        CancellationToken cancellationToken = default)
    {
        _db.GenerationRecords.Add(record);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
