using backend.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend;

/// <summary>
/// Background worker that keeps live snapshots and chart history up to date.
/// Each country sync runs in its own DI scope so repositories receive a fresh DbContext.
/// </summary>
public class EntsoeDataSyncService : BackgroundService
{
    private static readonly TimeSpan RefreshInterval = TimeSpan.FromMinutes(15);
    private const int MaxParallelCountries = 3;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EntsoeDataSyncService> _logger;
    private readonly SemaphoreSlim _syncLock = new(1, 1);

    public EntsoeDataSyncService(
        IServiceScopeFactory scopeFactory,
        ILogger<EntsoeDataSyncService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Allow the web host to finish starting before the first sync wave.
        await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);

        await RunFullSyncAsync(stoppingToken, isInitial: true);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(RefreshInterval, stoppingToken);
            await RunFullSyncAsync(stoppingToken, isInitial: false);
        }
    }

    private async Task RunFullSyncAsync(CancellationToken stoppingToken, bool isInitial)
    {
        if (!await _syncLock.WaitAsync(0, stoppingToken))
        {
            _logger.LogWarning("Skipping sync cycle because a previous run is still in progress.");
            return;
        }

        try
        {
            _logger.LogInformation(
                isInitial
                    ? "Starting initial ENTSO-E sync for all countries."
                    : "Starting scheduled ENTSO-E sync.");

            var startedAt = DateTime.UtcNow;
            var countryGate = new SemaphoreSlim(MaxParallelCountries);

            var tasks = CountryCatalog.All.Select(async country =>
            {
                await countryGate.WaitAsync(stoppingToken);

                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var entsoeService = scope.ServiceProvider.GetRequiredService<EntsoeService>();

                    await entsoeService.RefreshCountryDataAsync(
                        country.Key,
                        country.Value,
                        stoppingToken);

                    _logger.LogInformation("Sync completed for {Iso}.", country.Key);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Sync failed for {Iso}.", country.Key);
                }
                finally
                {
                    countryGate.Release();
                }
            });

            await Task.WhenAll(tasks);

            _logger.LogInformation(
                "ENTSO-E sync finished in {Elapsed:mm\\:ss}.",
                DateTime.UtcNow - startedAt);
        }
        finally
        {
            _syncLock.Release();
        }
    }
}
