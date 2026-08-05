using backend.Repositories;
using backend.Services;

namespace backend;

public static class ApplicationServicesExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services)
    {
        services.AddScoped<IGenerationRepository, GenerationRepository>();
        services.AddScoped<IHistoryRepository, HistoryRepository>();
        services.AddScoped<IPreferencesRepository, PreferencesRepository>();
        services.AddScoped<GenerationService>();
        services.AddScoped<HistoryService>();
        services.AddScoped<PreferencesService>();
        services.AddHttpClient<EntsoeService>();
        services.AddHostedService<EntsoeDataSyncService>();
        services.AddSingleton<PasswordProtector>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }

    public static IServiceCollection AddAppCors(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(
                "AllowFrontend",
                policy =>
                {
                    var origins = (Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "")
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .ToList();

                    // Local defaults when ALLOWED_ORIGINS is not set.
                    if (origins.Count == 0)
                    {
                        origins.AddRange(
                            [
                                "http://localhost:5173",
                                "http://localhost:5174",
                                "http://localhost:3000",
                            ]
                        );
                    }

                    policy
                        .WithOrigins(origins.ToArray())
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
            );
        });

        return services;
    }
}
