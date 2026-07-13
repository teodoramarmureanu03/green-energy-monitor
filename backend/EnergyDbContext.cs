using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend;

public class EnergyDbContext : DbContext
{
    public EnergyDbContext(DbContextOptions<EnergyDbContext> options) : base(options) { }

    public DbSet<GenerationRecord> GenerationRecords { get; set; }
    public DbSet<EnergySource> EnergySources { get; set; }
    public DbSet<CountryZone> CountryZones { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Lăsat complet gol! Datele sunt stocate și administrate direct în PostgreSQL.
    }
}