using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace backend;

public static class DatabaseExtensions
{
    public static IServiceCollection AddAppDatabase(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddDbContext<EnergyDbContext>(options =>
        {
            var connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? Environment.GetEnvironmentVariable("DATABASE_URL")
                ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    "Missing database connection. Set ConnectionStrings:DefaultConnection or DATABASE_URL."
                );
            }

            // Hosted Postgres (Railway/Render) often provides postgres:// URLs.
            if (
                connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
                || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
            )
            {
                var uri = new Uri(connectionString);
                var userInfo = uri.UserInfo.Split(':', 2);
                var user = Uri.UnescapeDataString(userInfo[0]);
                var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                var database = uri.AbsolutePath.Trim('/');
                connectionString =
                    $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={database};Username={user};Password={password};SSL Mode=Require;Trust Server Certificate=true";
            }

            options.UseNpgsql(connectionString);
            options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        });

        return services;
    }
}
