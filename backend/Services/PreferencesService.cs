using backend.Models;
using backend.Repositories;

namespace backend.Services;

/// <summary>
/// Handles viewer timezone preference validation and persistence.
/// </summary>
public class PreferencesService
{
    private readonly IPreferencesRepository _preferencesRepository;

    public PreferencesService(IPreferencesRepository preferencesRepository)
    {
        _preferencesRepository = preferencesRepository;
    }

    public async Task<ViewerTimezoneResponse?> GetTimezoneAsync(string clientId)
    {
        var preference = await _preferencesRepository.GetByClientIdAsync(clientId.Trim());
        return preference is null ? null : ToResponse(preference);
    }

    public async Task<(ViewerTimezoneResponse? Response, string? Error)> SaveTimezoneAsync(
        ViewerTimezoneRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ClientId) ||
            string.IsNullOrWhiteSpace(request.CountryIso) ||
            string.IsNullOrWhiteSpace(request.TimeZone))
        {
            return (null, "clientId, countryIso, and timeZone are required.");
        }

        var timeZone = request.TimeZone.Trim();
        if (!IsAcceptedTimeZone(timeZone))
        {
            return (null, $"Unknown time zone: {timeZone}.");
        }

        var preference = await _preferencesRepository.UpsertAsync(
            request.ClientId.Trim(),
            request.CountryIso.Trim().ToUpperInvariant(),
            timeZone);

        return (ToResponse(preference), null);
    }

    private static bool IsAcceptedTimeZone(string timeZone)
    {
        if (HistoryDtoMapper.TryGetTimeZone(timeZone, out _))
        {
            return true;
        }

        // Linux containers use IANA ids; Windows may fail FindSystemTimeZoneById.
        // Accept common IANA ids that contain a region/city separator.
        return timeZone.Contains('/');
    }

    private static ViewerTimezoneResponse ToResponse(ViewerTimezonePreference preference) =>
        new()
        {
            ClientId = preference.ClientId,
            CountryIso = preference.CountryIso,
            TimeZone = preference.TimeZone,
            UpdatedAt = preference.UpdatedAt,
        };
}
