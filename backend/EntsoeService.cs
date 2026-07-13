using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using backend.Models;

namespace backend.Services;

public class EntsoeService
{
    private readonly HttpClient _httpClient;
    private readonly EnergyDbContext _db;
    private readonly IConfiguration _config;

    public EntsoeService(HttpClient httpClient, EnergyDbContext db, IConfiguration config)
    {
        _httpClient = httpClient;
        _db = db;
        _config = config;
    }

    public async Task BackfillHistoryAsync(string iso, DateTime start, DateTime end)
    {
        var zoneCodes = await _db.CountryZones
            .Where(z => z.IsoCode == iso.ToUpper())
            .Select(z => z.ZoneCode)
            .ToListAsync();

        if (!zoneCodes.Any())
        {
            throw new ArgumentException($"Țara cu codul ISO '{iso}' nu este configurată în baza de date.");
        }

        var dbSources = await _db.EnergySources.ToListAsync();
        var sourceMap = dbSources.ToDictionary(s => s.Code, s => new { s.Name, s.IsRenewable });

        string apiKey = _config["EntsoeApiKey"] ?? throw new Exception("Cheia 'EntsoeApiKey' lipsește.");
        string startStr = start.Date.ToString("yyyyMMdd0000");
        string endStr = DateTime.Now.Date.AddDays(1).ToString("yyyyMMdd2359");

        foreach (var zoneCode in zoneCodes)
        {
            string url = $"https://web-api.tp.entsoe.eu/api?securityToken={apiKey}&documentType=A75&processType=A16&in_Domain={zoneCode}&periodStart={startStr}&periodEnd={endStr}";

            try
            {
                var response = await _httpClient.GetStringAsync(url);
                var xmlDoc = XDocument.Parse(response);
                XNamespace ns = xmlDoc.Root?.GetDefaultNamespace() ?? XNamespace.None;

                var timeSeriesList = xmlDoc.Descendants(ns + "TimeSeries");

                foreach (var ts in timeSeriesList)
                {
                    string? psrType = ts.Element(ns + "MktPSRType")?.Element(ns + "psrType")?.Value;

                    if (psrType != null && sourceMap.TryGetValue(psrType, out var sourceInfo))
                    {
                        var points = ts.Descendants(ns + "Point");
                        foreach (var point in points)
                        {
                            string? quantityStr = point.Element(ns + "quantity")?.Value;
                            if (double.TryParse(quantityStr, out double quantity))
                            {
                                var record = new GenerationRecord
                                {
                                    CountryIso = iso.ToUpper(),
                                    ZoneCode = zoneCode,
                                    EnergySourceCode = psrType,
                                    EnergySourceName = sourceInfo.Name,
                                    IsRenewable = sourceInfo.IsRenewable,
                                    ValueMw = quantity,
                                    Timestamp = start,
                                    
                                    // Păstrăm și câmpurile vechi cerute de restul aplicației tale:
                                    IsoCode = iso.ToUpper(),
                                    FetchedAt = DateTime.UtcNow
                                };

                                _db.GenerationRecords.Add(record);
                            }
                        }
                    }
                }
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Eroare zona {zoneCode}: {ex.Message}");
            }
        }
    }
}