using MessengerApp.Domain.Entities;

namespace MessengerApp.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
    RefreshToken GenerateRefreshToken(Guid userId, string? ipAddress = null);
}
