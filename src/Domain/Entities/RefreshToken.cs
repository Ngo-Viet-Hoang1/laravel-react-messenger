using MessengerApp.Domain.Common;

namespace MessengerApp.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? CreatedByIp { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? RevokedByIp { get; set; }
    public string? ReplacedByToken { get; set; }

    public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;

    public RefreshToken() { }

    public RefreshToken(
        Guid userId,
        string token,
        DateTimeOffset expiresAt,
        string? createdByIp = null)
    {
        UserId = userId;
        Token = token;
        ExpiresAt = expiresAt;
        CreatedByIp = createdByIp;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public void Revoke(string? ipAddress = null, string? replacedByToken = null)
    {
        RevokedAt = DateTimeOffset.UtcNow;
        RevokedByIp = ipAddress;
        ReplacedByToken = replacedByToken;
    }
}
