using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories;

public interface IGenerationRepository
{
    Task<GenerationRecord?> GetLatestRecordAsync(string iso);

    Task<List<CountryZone>> GetConfiguredCountriesAsync();

    Task<IReadOnlyList<string>> GetZoneCodesAsync(string iso);

    Task<Dictionary<string, (string Name, bool Renewable)>> GetEnergySourceMapAsync();

    Task AddRecordAsync(GenerationRecord record, CancellationToken cancellationToken = default);
}
