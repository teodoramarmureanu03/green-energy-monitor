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
            .Select(key => (key.PeriodType, key.PeriodStart.Date))
            .ToHashSet();
    }

    public async Task AddChartPointsAsync(
        IEnumerable<GenerationChartPoint> points,
        CancellationToken cancellationToken = default)
    {
        var pointList = points.ToList();

        if (pointList.Count == 0)
        {
            return;
        }

        var iso = pointList[0].IsoCode.ToUpperInvariant();
        var periodTypes = pointList.Select(point => point.PeriodType).Distinct().ToList();

        var existingPoints = await _db.GenerationChartPoints
            .Where(chartPoint =>
                chartPoint.IsoCode == iso &&
                periodTypes.Contains(chartPoint.PeriodType))
            .ToListAsync(cancellationToken);

        var existingByKey = existingPoints.ToDictionary(
            point => (point.PeriodType, point.PeriodStart.Date),
            point => point);

        foreach (var point in pointList)
        {
            var key = (point.PeriodType, point.PeriodStart.Date);

            if (existingByKey.TryGetValue(key, out var existing))
            {
                existing.CountryName = point.CountryName;
                existing.PeriodEnd = point.PeriodEnd;
                existing.Total = point.Total;
                existing.RenewableMw = point.RenewableMw;
                existing.RenewablePct = point.RenewablePct;
                existing.WindMw = point.WindMw;
                existing.SolarMw = point.SolarMw;
                existing.UpdatedAt = point.UpdatedAt;
                continue;
            }

            _db.GenerationChartPoints.Add(point);
            existingByKey[key] = point;
        }

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
