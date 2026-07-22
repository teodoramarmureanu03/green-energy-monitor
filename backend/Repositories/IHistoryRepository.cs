using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories;

public interface IHistoryRepository
{
    Task<List<HistoryResponse>> GetChartPointsAsync(
        string iso,
        string periodType,
        int limit,
        string? timeZone = null);

    Task<HashSet<(string PeriodType, DateTime PeriodStart)>> GetExistingPeriodKeysAsync(
        string iso,
        string? timeZone = null);

    Task AddChartPointsAsync(
        IEnumerable<GenerationChartPoint> points,
        string? timeZone = null,
        CancellationToken cancellationToken = default);

    Task TrimChartPointsAsync(
        string iso,
        int dailyKeep,
        int weeklyKeep,
        int monthlyKeep,
        string? timeZone = null,
        CancellationToken cancellationToken = default);
}
