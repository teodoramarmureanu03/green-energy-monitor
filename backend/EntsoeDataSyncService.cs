using backend;
using backend.Services;
using Microsoft.Extensions.Hosting;

namespace backend;

public class EntsoeDataSyncService : BackgroundService
{
    private static readonly TimeSpan RefreshInterval =
        TimeSpan.FromMinutes(15);

    // Limit parallel countries to stay within ENTSO-E rate limits.
    private const int MaxParallelCountries = 3;

    private readonly EntsoeService _entsoe;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly SemaphoreSlim _syncLock = new(1, 1);

    public EntsoeDataSyncService(
        EntsoeService entsoe,
        IServiceScopeFactory scopeFactory
    )
    {
        _entsoe = entsoe;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken
    )
    {
        // Let the web server start immediately.
        await Task.Delay(
            TimeSpan.FromSeconds(1),
            stoppingToken
        );

        await RunFullSyncAsync(
            stoppingToken,
            isInitial: true
        );

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(
                RefreshInterval,
                stoppingToken
            );

            await RunFullSyncAsync(
                stoppingToken,
                isInitial: false
            );
        }
    }

    private async Task RunFullSyncAsync(
        CancellationToken stoppingToken,
        bool isInitial
    )
    {
        if (!await _syncLock.WaitAsync(0, stoppingToken))
        {
            Console.WriteLine(
                "Sync already in progress — skipping this cycle."
            );

            return;
        }

        try
        {
            Console.WriteLine(
                isInitial
                    ? "Starting initial data sync from ENTSO-E..."
                    : "Starting scheduled 15-minute data sync..."
            );

            var startedAt = DateTime.UtcNow;
            var countryGate = new SemaphoreSlim(
                MaxParallelCountries
            );

            var tasks = CountryCatalog.Names.Select(
                async country =>
                {
                    await countryGate.WaitAsync(
                        stoppingToken
                    );

                    try
                    {
                        using var scope =
                            _scopeFactory.CreateScope();

                        var db = scope.ServiceProvider
                            .GetRequiredService<
                                EnergyDbContext
                            >();

                        await _entsoe.RefreshCountryDataAsync(
                            country.Key,
                            country.Value,
                            db,
                            stoppingToken
                        );

                        Console.WriteLine(
                            $"[{country.Key}] Sync complete."
                        );
                    }
                    catch (Exception exception)
                    {
                        Console.WriteLine(
                            $"[{country.Key}] Sync failed: " +
                            exception.Message
                        );
                    }
                    finally
                    {
                        countryGate.Release();
                    }
                }
            );

            await Task.WhenAll(tasks);

            var elapsed = DateTime.UtcNow - startedAt;

            Console.WriteLine(
                isInitial
                    ? $"Initial sync finished in {elapsed:mm\\:ss}."
                    : $"Scheduled sync finished in {elapsed:mm\\:ss}. " +
                      $"Next run in 15 minutes."
            );
        }
        finally
        {
            _syncLock.Release();
        }
    }
}
