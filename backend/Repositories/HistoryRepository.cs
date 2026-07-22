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
        int limit,
        string? timeZone = null)
    {
        iso = iso.ToUpper();

        // Fetch extra rows so timezone-offset duplicates can be collapsed to unique calendar dates.
        var points = await _db.GenerationChartPoints
            .AsNoTracking()
            .Where(point => point.IsoCode == iso && point.PeriodType == periodType)
            .OrderByDescending(point => point.UpdatedAt)
            .ThenByDescending(point => point.PeriodStart.TimeOfDay == TimeSpan.Zero)
            .ThenByDescending(point => point.PeriodStart)
            .Take(limit * 3)
            .ToListAsync();

        return points
            .GroupBy(point => HistoryDtoMapper.FormatPeriodDate(point.PeriodStart, timeZone))
            .Select(group => HistoryDtoMapper.BuildHistoryDto(group.First(), timeZone))
            .OrderBy(dto => dto.Date)
            .Take(limit)
            .ToList();
    }

    public async Task<HashSet<(string PeriodType, DateTime PeriodStart)>> GetExistingPeriodKeysAsync(
        string iso,
        string? timeZone = null)
    {
        iso = iso.ToUpper();

        var keys = await _db.GenerationChartPoints
            .AsNoTracking()
            .Where(point => point.IsoCode == iso)
            .Select(point => new { point.PeriodType, point.PeriodStart })
            .ToListAsync();

        return keys
            .Select(key => (
                key.PeriodType,
                HistoryDtoMapper.ToCalendarDateKey(key.PeriodStart, timeZone).Date))
            .ToHashSet();
    }

    public async Task AddChartPointsAsync(
        IEnumerable<GenerationChartPoint> points,
        string? timeZone = null,
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

        var existingByKey = existingPoints
            .GroupBy(point => (
                point.PeriodType,
                HistoryDtoMapper.ToCalendarDateKey(point.PeriodStart, timeZone).Date))
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(point => point.PeriodStart.TimeOfDay == TimeSpan.Zero)
                    .ThenByDescending(point => point.UpdatedAt)
                    .First());

        var duplicatePoints = existingPoints
            .Where(point => !existingByKey.Values.Contains(point))
            .ToList();

        if (duplicatePoints.Count > 0)
        {
            _db.GenerationChartPoints.RemoveRange(duplicatePoints);
        }

        foreach (var point in pointList)
        {
            point.PeriodStart = HistoryDtoMapper.ToCalendarDateKey(point.PeriodStart, timeZone);
            var key = (point.PeriodType, point.PeriodStart.Date);

            if (existingByKey.TryGetValue(key, out var existing))
            {
                existing.PeriodStart = point.PeriodStart;
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
        string? timeZone = null,
        CancellationToken cancellationToken = default)
    {
        iso = iso.ToUpper();

        await NormalizeAndDeduplicateAsync(iso, "Day", timeZone, cancellationToken);
        await NormalizeAndDeduplicateAsync(iso, "Week", timeZone, cancellationToken);
        await NormalizeAndDeduplicateAsync(iso, "Month", timeZone, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var staleDaily = await SelectStaleAsync(iso, "Day", dailyKeep, timeZone, cancellationToken);
        var staleWeekly = await SelectStaleAsync(iso, "Week", weeklyKeep, timeZone, cancellationToken);
        var staleMonthly = await SelectStaleAsync(iso, "Month", monthlyKeep, timeZone, cancellationToken);

        _db.GenerationChartPoints.RemoveRange(staleDaily);
        _db.GenerationChartPoints.RemoveRange(staleWeekly);
        _db.GenerationChartPoints.RemoveRange(staleMonthly);

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task NormalizeAndDeduplicateAsync(
        string iso,
        string periodType,
        string? timeZone,
        CancellationToken cancellationToken)
    {
        var points = await _db.GenerationChartPoints
            .Where(point => point.IsoCode == iso && point.PeriodType == periodType)
            .ToListAsync(cancellationToken);

        if (points.Count == 0)
        {
            return;
        }

        var keepers = points
            .GroupBy(point => HistoryDtoMapper.ToCalendarDateKey(point.PeriodStart, timeZone).Date)
            .Select(group => group
                .OrderByDescending(point => point.PeriodStart.TimeOfDay == TimeSpan.Zero)
                .ThenByDescending(point => point.UpdatedAt)
                .First())
            .ToHashSet();

        foreach (var keeper in keepers)
        {
            keeper.PeriodStart = HistoryDtoMapper.ToCalendarDateKey(keeper.PeriodStart, timeZone);
        }

        var duplicates = points.Where(point => !keepers.Contains(point)).ToList();
        if (duplicates.Count > 0)
        {
            _db.GenerationChartPoints.RemoveRange(duplicates);
        }
    }

    private async Task<List<GenerationChartPoint>> SelectStaleAsync(
        string iso,
        string periodType,
        int keep,
        string? timeZone,
        CancellationToken cancellationToken)
    {
        var points = await _db.GenerationChartPoints
            .Where(point => point.IsoCode == iso && point.PeriodType == periodType)
            .ToListAsync(cancellationToken);

        var keepIds = points
            .GroupBy(point => HistoryDtoMapper.ToCalendarDateKey(point.PeriodStart, timeZone).Date)
            .Select(group => group
                .OrderByDescending(point => point.PeriodStart.TimeOfDay == TimeSpan.Zero)
                .ThenByDescending(point => point.UpdatedAt)
                .First())
            .OrderByDescending(point => HistoryDtoMapper.ToCalendarDateKey(point.PeriodStart, timeZone))
            .Take(keep)
            .Select(point => point.Id)
            .ToHashSet();

        return points.Where(point => !keepIds.Contains(point.Id)).ToList();
    }
}
