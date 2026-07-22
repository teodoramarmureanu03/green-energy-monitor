using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class PreferencesRepository : IPreferencesRepository
{
    private readonly EnergyDbContext _db;

    public PreferencesRepository(EnergyDbContext db)
    {
        _db = db;
    }

    public async Task<ViewerTimezonePreference?> GetByClientIdAsync(string clientId)
    {
        return await _db.ViewerTimezonePreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.ClientId == clientId);
    }

    public async Task<ViewerTimezonePreference> UpsertAsync(
        string clientId,
        string countryIso,
        string timeZone)
    {
        var preference = await _db.ViewerTimezonePreferences
            .FirstOrDefaultAsync(item => item.ClientId == clientId);

        if (preference is null)
        {
            preference = new ViewerTimezonePreference
            {
                ClientId = clientId,
            };
            _db.ViewerTimezonePreferences.Add(preference);
        }

        preference.CountryIso = countryIso;
        preference.TimeZone = timeZone;
        preference.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return preference;
    }

    public async Task<string?> GetLatestTimeZoneIdAsync(
        CancellationToken cancellationToken = default)
    {
        return await _db.ViewerTimezonePreferences
            .AsNoTracking()
            .OrderByDescending(preference => preference.UpdatedAt)
            .Select(preference => preference.TimeZone)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
