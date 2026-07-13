using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend;

public class EnergyDbContext : DbContext
{
    public EnergyDbContext(
        DbContextOptions<EnergyDbContext> options
    ) : base(options)
    {
    }

    public DbSet<GenerationRecord> GenerationRecords =>
        Set<GenerationRecord>();

    public DbSet<GenerationChartPoint> GenerationChartPoints =>
        Set<GenerationChartPoint>();

    public DbSet<EnergySource> EnergySources =>
        Set<EnergySource>();

    public DbSet<CountryZone> CountryZones =>
        Set<CountryZone>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<GenerationRecord>(entity =>
        {
            entity.HasKey(record => record.Id);

            entity.Property(record => record.IsoCode)
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(record => record.CountryName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(record => record.BySourceJson)
                .HasColumnType("text");

            entity.Property(record => record.ZonesAggregatedJson)
                .HasColumnType("text");

            entity.HasIndex(record => new
            {
                record.IsoCode,
                record.FetchedAt
            });
        });

        modelBuilder.Entity<GenerationChartPoint>(entity =>
        {
            entity.HasKey(point => point.Id);

            entity.Property(point => point.IsoCode)
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(point => point.CountryName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(point => point.PeriodType)
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(point => new
            {
                point.IsoCode,
                point.PeriodType,
                point.PeriodStart
            })
            .IsUnique();
        });
    }
}
