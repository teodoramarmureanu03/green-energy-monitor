using System.Text.Json;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

/// <summary>
/// Read-side service for live generation snapshots exposed to the API.
/// </summary>
public class GenerationService
{
    private readonly IGenerationRepository _generationRepository;

    public GenerationService(IGenerationRepository generationRepository)
    {
        _generationRepository = generationRepository;
    }

    public async Task<CountryGeneration?> GetLiveGenerationAsync(string iso)
    {
        var record = await _generationRepository.GetLatestRecordAsync(iso);
        return record is null ? null : MapToCountryGeneration(record);
    }

    public async Task<List<CountryZone>> GetCountriesAsync()
    {
        return await _generationRepository.GetConfiguredCountriesAsync();
    }

    private static CountryGeneration MapToCountryGeneration(GenerationRecord record)
    {
        var bySource = string.IsNullOrWhiteSpace(record.BySourceJson)
            ? new List<SourceBreakdown>()
            : JsonSerializer.Deserialize<List<SourceBreakdown>>(record.BySourceJson)
                ?? new List<SourceBreakdown>();

        var zones = string.IsNullOrWhiteSpace(record.ZonesAggregatedJson)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(record.ZonesAggregatedJson)
                ?? new List<string>();

        return new CountryGeneration
        {
            IsoCode = record.IsoCode,
            Country = record.CountryName,
            Timestamp = record.FetchedAt.ToString("o"),
            ZonesAggregated = zones,
            Total = record.Total,
            RenewableMw = record.RenewableMw,
            RenewablePct = record.RenewablePct,
            BySource = bySource,
        };
    }
}
