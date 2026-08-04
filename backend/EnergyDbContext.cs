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
    public DbSet<ViewerTimezonePreference> ViewerTimezonePreferences =>
        Set<ViewerTimezonePreference>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PendingRegistration> PendingRegistrations => Set<PendingRegistration>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Username).IsRequired();
            entity.Property(user => user.Email).IsRequired();
            entity.Property(user => user.DisplayName).IsRequired();
            entity.Property(user => user.Gender).IsRequired();
            entity.Property(user => user.PasswordHash).IsRequired();
            entity.Property(user => user.Role).IsRequired();
            entity.Property(user => user.PasswordResetTokenHash).HasMaxLength(128);
            entity.HasIndex(user => user.Email);
            entity.HasIndex(user => user.Username).IsUnique();
            entity.HasIndex(user => user.PasswordResetTokenHash);
        });

        modelBuilder.Entity<PendingRegistration>(entity =>
        {
            entity.ToTable("PendingRegistrations");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Username).IsRequired();
            entity.Property(item => item.Email).IsRequired();
            entity.Property(item => item.DisplayName).IsRequired();
            entity.Property(item => item.Gender).IsRequired();
            entity.Property(item => item.PasswordHash).IsRequired();
            entity.Property(item => item.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(item => item.Username).IsUnique();
            entity.HasIndex(item => item.TokenHash).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(token => token.Id);
            entity.Property(token => token.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(token => token.TokenHash).IsUnique();
            entity.HasIndex(token => token.UserId);
            entity.HasOne(token => token.User)
                .WithMany()
                .HasForeignKey(token => token.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

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

        modelBuilder.Entity<ViewerTimezonePreference>(entity =>
        {
            entity.HasKey(preference => preference.Id);
            entity.Property(preference => preference.ClientId)
                .HasMaxLength(100)
                .IsRequired();
            entity.Property(preference => preference.CountryIso)
                .HasMaxLength(10)
                .IsRequired();
            entity.Property(preference => preference.TimeZone)
                .HasMaxLength(100)
                .IsRequired();
            entity.HasIndex(preference => preference.ClientId).IsUnique();
        });

    }
}

