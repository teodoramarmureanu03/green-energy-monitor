using backend.Models;

namespace backend.Services;

public interface IGenerationService
{
    // Asta este comanda: primește țara și perioada, returnează datele gata calculate
    Task<List<HistoryDto>> GetHistoryCalculatedAsync(string iso, string period);
}