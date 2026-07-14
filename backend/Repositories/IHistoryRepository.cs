using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories;

public interface IHistoryRepository
{
    Task<List<HistoryDto>> GetChartPointsAsync(
        string iso,
        string periodType,
        int limit);

    Task<HashSet<(string PeriodType, DateTime PeriodStart)>> GetExistingPeriodKeysAsync(string iso);

    Task AddChartPointsAsync(
        IEnumerable<GenerationChartPoint> points,
        CancellationToken cancellationToken = default);

    Task TrimChartPointsAsync(
        string iso,
        int dailyKeep,
        int weeklyKeep,
        int monthlyKeep,
        CancellationToken cancellationToken = default);
}
