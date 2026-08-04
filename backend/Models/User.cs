namespace backend.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Gender { get; set; } = "Other";
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Viewer";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? PasswordResetTokenHash { get; set; }
        public DateTime? PasswordResetTokenExpiresAt { get; set; }
    }
}
