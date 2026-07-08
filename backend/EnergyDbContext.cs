using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend;

// EF Core DbContext — the single gateway to the PostgreSQL database.
// All queries go through this class; no raw SQL anywhere.
public class EnergyDbContext : DbContext
{
    public EnergyDbContext(DbContextOptions<EnergyDbContext> options) : base(options) { }

    // One table: GenerationRecords — one row per country, updated every 15 minutes
    public DbSet<GenerationRecord> GenerationRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GenerationRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            // IsoCode must be unique — one row per country
            entity.Property(e => e.IsoCode).HasMaxLength(10).IsRequired();
            entity.Property(e => e.CountryName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.BySourceJson).HasColumnType("text");
            entity.Property(e => e.ZonesAggregatedJson).HasColumnType("text");
        });
    }
}
