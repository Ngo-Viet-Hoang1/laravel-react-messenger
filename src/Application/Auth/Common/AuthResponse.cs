namespace MessengerApp.Application.Auth.Common;

public record UserDto(
    Guid Id,
    string Email,
    string Username,
    string? AvatarUrl
);

public record AuthResult(
    UserDto User,
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAt
);

public record AuthResponse(
    UserDto User,
    string AccessToken
);

public record CurrentUserResponse(
    Guid Id,
    string Email,
    string Username,
    string? AvatarUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastSeenAt
);
