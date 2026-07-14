using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend;

/// <summary>
/// Entity Framework context for energy production data and reference tables.
/// Schema changes are applied through EF migrations at startup.
/// </summary>
public class EnergyDbContext : DbContext
{
    public EnergyDbContext(DbContextOptions<EnergyDbContext> options)
        : base(options)
    {
    }

    public DbSet<GenerationRecord> GenerationRecords => Set<GenerationRecord>();
    public DbSet<GenerationChartPoint> GenerationChartPoints => Set<GenerationChartPoint>();
    public DbSet<EnergySource> EnergySources => Set<EnergySource>();
    public DbSet<CountryZone> CountryZones => Set<CountryZone>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Live snapshot written after each ENTSO-E sync cycle.
        modelBuilder.Entity<GenerationRecord>(entity =>
        {
            entity.HasKey(record => record.Id);

            entity.Property(record => record.IsoCode)
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(record => record.CountryName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(record => record.BySourceJson).HasColumnType("text");
            entity.Property(record => record.ZonesAggregatedJson).HasColumnType("text");

            entity.HasIndex(record => new { record.IsoCode, record.FetchedAt });
        });

        // Pre-aggregated buckets used by dashboard history charts.
        modelBuilder.Entity<GenerationChartPoint>(entity =>
        {
            entity.HasKey(point => point.Id);

            entity.Property(point => point.IsoCode).HasMaxLength(10).IsRequired();
            entity.Property(point => point.CountryName).HasMaxLength(100).IsRequired();
            entity.Property(point => point.PeriodType).HasMaxLength(20).IsRequired();

            entity.HasIndex(point => new
            {
                point.IsoCode,
                point.PeriodType,
                point.PeriodStart,
            }).IsUnique();
        });

        modelBuilder.Entity<EnergySource>(entity =>
        {
            entity.HasKey(source => source.Code);
            entity.Property(source => source.Code).HasMaxLength(10);
            entity.Property(source => source.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<CountryZone>(entity =>
        {
            entity.HasKey(zone => zone.Id);
            entity.Property(zone => zone.IsoCode).HasMaxLength(10);
            entity.Property(zone => zone.ZoneCode).HasMaxLength(50);
        });
    }
}
