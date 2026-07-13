using backend.Models;

namespace backend.Repositories;

public interface IGenerationRepository
{
    // Cere doar datele brute
    Task<List<GenerationRecord>> GetRawHistoryAsync(string iso, DateTime startDate);
}