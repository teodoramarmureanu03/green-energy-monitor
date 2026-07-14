using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class HistoryRepository : IHistoryRepository
{
    private readonly EnergyDbContext _db;

    public HistoryRepository(EnergyDbContext db)
    {
        _db = db;
    }

    public async Task<List<HistoryDto>> GetChartPointsAsync(
        string iso,
        string periodType,
        int limit)
    {
        iso = iso.ToUpper();

        var points = await _db.GenerationChartPoints
            .AsNoTracking()
            .Where(point => point.IsoCode == iso && point.PeriodType == periodType)
            .OrderByDescending(point => point.PeriodStart)
            .Take(limit)
            .OrderBy(point => point.PeriodStart)
            .ToListAsync();

        return points.Select(HistoryDtoMapper.BuildHistoryDto).ToList();
    }

    public async Task<HashSet<(string PeriodType, DateTime PeriodStart)>> GetExistingPeriodKeysAsync(string iso)
    {
        iso = iso.ToUpper();

        var keys = await _db.GenerationChartPoints
            .AsNoTracking()
            .Where(point => point.IsoCode == iso)
            .Select(point => new { point.PeriodType, point.PeriodStart })
            .ToListAsync();

        return keys
            .Select(key => (key.PeriodType, key.PeriodStart))
            .ToHashSet();
    }

    public async Task AddChartPointsAsync(
        IEnumerable<GenerationChartPoint> points,
        CancellationToken cancellationToken = default)
    {
        _db.GenerationChartPoints.AddRange(points);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task TrimChartPointsAsync(
        string iso,
        int dailyKeep,
        int weeklyKeep,
        int monthlyKeep,
        CancellationToken cancellationToken = default)
    {
        iso = iso.ToUpper();

        var staleDaily = await _db.GenerationChartPoints
            .Where(point => point.IsoCode == iso && point.PeriodType == "Day")
            .OrderByDescending(point => point.PeriodStart)
            .Skip(dailyKeep)
            .ToListAsync(cancellationToken);

        var staleWeekly = await _db.GenerationChartPoints
            .Where(point => point.IsoCode == iso && point.PeriodType == "Week")
            .OrderByDescending(point => point.PeriodStart)
            .Skip(weeklyKeep)
            .ToListAsync(cancellationToken);

        var staleMonthly = await _db.GenerationChartPoints
            .Where(point => point.IsoCode == iso && point.PeriodType == "Month")
            .OrderByDescending(point => point.PeriodStart)
            .Skip(monthlyKeep)
            .ToListAsync(cancellationToken);

        _db.GenerationChartPoints.RemoveRange(staleDaily);
        _db.GenerationChartPoints.RemoveRange(staleWeekly);
        _db.GenerationChartPoints.RemoveRange(staleMonthly);

        await _db.SaveChangesAsync(cancellationToken);
    }
}
