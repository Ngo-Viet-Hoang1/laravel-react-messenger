using MessengerApp.Domain.Common;
using MessengerApp.Domain.Common.Contracts;

namespace MessengerApp.Domain.Entities;

public class User : BaseAuditableEntity, ISoftDelete
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTimeOffset? LastSeenAt { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }

    public User() { }

    public User(
        string email,
        string username,
        string passwordHash,
        string? avatarUrl = null)
    {
        Email = email;
        Username = username;
        PasswordHash = passwordHash;
        AvatarUrl = avatarUrl;
        LastSeenAt = null;
        IsDeleted = false;
    }

    public static User Create(
        string email,
        string username,
        string passwordHash,
        string? avatarUrl = null)
    {
        return new User(
            email.Trim().ToLowerInvariant(),
            username.Trim(),
            passwordHash,
            avatarUrl);
    }

    public void UpdateLastSeen(DateTimeOffset? timestamp = null)
    {
        LastSeenAt = timestamp ?? DateTimeOffset.UtcNow;
    }

    public void UpdateProfile(string username, string? avatarUrl)
    {
        Username = username.Trim();
        AvatarUrl = avatarUrl;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }
}
