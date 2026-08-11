using backend.Models;

namespace backend.DTOs;

public class UpdateProfileRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class AdminUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminCreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AdminUpdateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string? Password { get; set; }
}

public class AdminUserListQuery
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public string? Gender { get; set; }
    public string? SortBy { get; set; }
    public string? SortDir { get; set; }
}
