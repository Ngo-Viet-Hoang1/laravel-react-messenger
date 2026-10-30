using MessengerApp.Domain.Common;

namespace MessengerApp.Application.Common.Interfaces;

public record GoogleUserPayload(
    string Email,
    string Name,
    string? Picture,
    string Subject);

public interface IGoogleAuthService
{
    Task<Result<GoogleUserPayload>> ValidateIdTokenAsync(string idToken, CancellationToken ct = default);
}
