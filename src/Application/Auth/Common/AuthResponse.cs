namespace MessengerApp.Application.Auth.Common;

public record AuthResponse(
    Guid UserId,
    string Email,
    string Username,
    string? AvatarUrl,
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAt
);

public record CurrentUserResponse(
    Guid Id,
    string Email,
    string Username,
    string? AvatarUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastSeenAt
);
