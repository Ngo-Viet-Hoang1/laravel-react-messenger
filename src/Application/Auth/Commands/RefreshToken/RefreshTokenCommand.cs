using FluentValidation;
using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken) : IRequest<Result<AuthResponse>>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty().WithMessage("Refresh token is required.");
    }
}

public class RefreshTokenCommandHandler(
    IApplicationDbContext context,
    IJwtTokenService jwtTokenService,
    IClientInfoProvider clientInfoProvider) : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        var token = await context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == cmd.RefreshToken, ct);

        if (token == null)
        {
            return Result.Failure<AuthResponse>(
                Error.Unauthorized("Auth.InvalidRefreshToken", "Invalid refresh token."));
        }

        var clientIp = clientInfoProvider.ClientIpAddress;

        if (token.IsRevoked)
        {
            var compromisedTokens = await context.RefreshTokens
                .Where(r => r.UserId == token.UserId && r.RevokedAt == null)
                .ToListAsync(ct);

            foreach (var compromised in compromisedTokens)
            {
                compromised.Revoke(clientIp);
            }

            await context.SaveChangesAsync(ct);

            return Result.Failure<AuthResponse>(
                Error.Unauthorized("Auth.TokenReuseDetected", "Refresh token reuse detected. All active sessions have been invalidated."));
        }

        if (token.IsExpired)
        {
            return Result.Failure<AuthResponse>(
                Error.Unauthorized("Auth.RefreshTokenExpired", "Refresh token has expired. Please log in again."));
        }

        var user = await context.Users.FindAsync([token.UserId], ct);
        if (user == null || user.IsDeleted)
        {
            return Result.Failure<AuthResponse>(
                Error.Unauthorized("Auth.UserNotFound", "User account not found or has been deactivated."));
        }

        var newRefreshToken = jwtTokenService.GenerateRefreshToken(user.Id, clientIp);
        token.Revoke(clientIp, newRefreshToken.Token);

        var newAccessToken = jwtTokenService.GenerateAccessToken(user);

        context.RefreshTokens.Add(newRefreshToken);
        await context.SaveChangesAsync(ct);

        return Result.Success(new AuthResponse(
            user.Id,
            user.Email,
            user.Username,
            user.AvatarUrl,
            newAccessToken,
            newRefreshToken.Token,
            newRefreshToken.ExpiresAt));
    }
}
