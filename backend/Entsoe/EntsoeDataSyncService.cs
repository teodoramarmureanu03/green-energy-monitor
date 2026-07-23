using backend.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend;

/// <summary>
/// Background worker that keeps live snapshots and chart history up to date.
/// Each country sync runs in its own DI scope so repositories receive a fresh DbContext.
/// Live snapshots run first so the UI can show every country quickly; chart history follows.
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

            // Phase 1: live snapshots only — map/comparison become usable quickly.
            await SyncAllCountriesAsync(
                "live snapshot",
                (entsoe, iso, name, token) =>
                    entsoe.RefreshLiveSnapshotAsync(iso, name, token),
                stoppingToken);

            // Phase 2: chart history (heavier; does not block live data availability).
            await SyncAllCountriesAsync(
                "chart history",
                (entsoe, iso, name, token) =>
                    entsoe.RefreshChartHistoryAsync(iso, name, token),
                stoppingToken);

            _logger.LogInformation(
                "ENTSO-E sync finished in {Elapsed:mm\\:ss}.",
                DateTime.UtcNow - startedAt);
        }
        finally
        {
            _syncLock.Release();
        }
    }

    private async Task SyncAllCountriesAsync(
        string phaseName,
        Func<EntsoeService, string, string, CancellationToken, Task> syncAction,
        CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting {Phase} phase.", phaseName);

        var countryGate = new SemaphoreSlim(MaxParallelCountries);

        var tasks = CountryCatalog.All.Select(async country =>
        {
            await countryGate.WaitAsync(stoppingToken);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var entsoeService = scope.ServiceProvider.GetRequiredService<EntsoeService>();

                await syncAction(
                    entsoeService,
                    country.Key,
                    country.Value,
                    stoppingToken);

                _logger.LogInformation(
                    "{Phase} completed for {Iso}.",
                    phaseName,
                    country.Key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "{Phase} failed for {Iso}.",
                    phaseName,
                    country.Key);
            }
            finally
            {
                countryGate.Release();
            }
        });

        await Task.WhenAll(tasks);

        _logger.LogInformation("Finished {Phase} phase.", phaseName);
    }
}
