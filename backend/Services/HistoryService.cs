using backend.Models;
using backend.Repositories;

namespace backend.Services;

/// <summary>
/// Maps UI history periods to pre-aggregated chart buckets stored in the database.
/// </summary>
public class HistoryService
{
    private readonly IHistoryRepository _historyRepository;

    public HistoryService(IHistoryRepository historyRepository)
    {
        _historyRepository = historyRepository;
    }

    public async Task<List<HistoryDto>> GetHistoryAsync(string iso, string period)
    {
        var periodType = period.ToLower() switch
        {
            "month" => "Week",
            "year" => "Month",
            _ => "Day",
        };

        var limit = periodType switch
        {
            "Day" => 7,
            "Week" => 5,
            "Month" => 12,
            _ => 7,
        };

        return await _historyRepository.GetChartPointsAsync(iso, periodType, limit);
    }
}
