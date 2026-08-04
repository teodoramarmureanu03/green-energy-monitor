using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize(Roles = AuthService.AdminRole)]
[Route("api/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IAuthService _authService;

    public AdminUsersController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet]
    public async Task<IActionResult> ListUsers()
    {
        var users = await _authService.ListUsersAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequest request)
    {
        var (user, error) = await _authService.AdminCreateUserAsync(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        return Ok(user);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] AdminUpdateUserRequest request)
    {
        var (user, error) = await _authService.AdminUpdateUserAsync(id, request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        return Ok(user);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var (ok, error) = await _authService.AdminDeleteUserAsync(id);
        if (!ok)
        {
            return BadRequest(new { message = error });
        }

        return Ok(new { message = "User deleted." });
    }
}
