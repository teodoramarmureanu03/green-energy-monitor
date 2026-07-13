using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/generation")]
public class GetLiveGenerationController : ControllerBase
{
    // Răspunde doar la GET /api/generation/live/{iso}
    [HttpGet("live/{iso}")]
    public async Task<IActionResult> HandleAsync(string iso)
    {
        // Logica pentru a aduce datele de azi/acum
        return Ok();
    }
}