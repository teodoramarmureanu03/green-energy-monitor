using backend.Models;

namespace backend.Repositories;

public interface IPreferencesRepository
{
    Task<ViewerTimezonePreference?> GetByClientIdAsync(string clientId);

    Task<ViewerTimezonePreference> UpsertAsync(
        string clientId,
        string countryIso,
        string timeZone);

    Task<string?> GetLatestTimeZoneIdAsync(CancellationToken cancellationToken = default);
}
