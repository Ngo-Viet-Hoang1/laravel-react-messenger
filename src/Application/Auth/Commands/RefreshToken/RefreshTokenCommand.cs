using FluentValidation;
using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string? RefreshToken) : IRequest<Result<AuthResult>>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        When(x => !string.IsNullOrEmpty(x.RefreshToken), () =>
        {
            RuleFor(x => x.RefreshToken).MaximumLength(512);
        });
    }
}

public class RefreshTokenCommandHandler(
    IApplicationDbContext context,
    IJwtTokenService jwtTokenService,
    IClientInfoProvider clientInfoProvider) : IRequestHandler<RefreshTokenCommand, Result<AuthResult>>
{
    public async Task<Result<AuthResult>> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.RefreshToken))
        {
            return Result.Failure<AuthResult>(
                Error.Unauthorized("Auth.MissingRefreshToken", "No refresh token was provided in cookie or request body."));
        }

        var token = await context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == cmd.RefreshToken, ct);

        if (token == null)
        {
            return Result.Failure<AuthResult>(
                Error.Unauthorized("Auth.InvalidRefreshToken", "Invalid refresh token."));
        }

        string? clientIp = clientInfoProvider.ClientIpAddress;

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

            return Result.Failure<AuthResult>(
                Error.Unauthorized("Auth.TokenReuseDetected", "Refresh token reuse detected. All active sessions have been invalidated."));
        }

        if (token.IsExpired)
        {
            return Result.Failure<AuthResult>(
                Error.Unauthorized("Auth.RefreshTokenExpired", "Refresh token has expired. Please log in again."));
        }

        var user = await context.Users.FindAsync([token.UserId], ct);
        if (user == null || user.IsDeleted)
        {
            return Result.Failure<AuthResult>(
                Error.Unauthorized("Auth.UserNotFound", "User account not found or has been deactivated."));
        }

        var newRefreshToken = jwtTokenService.GenerateRefreshToken(user.Id, clientIp);
        token.Revoke(clientIp, newRefreshToken.Token);

        string newAccessToken = jwtTokenService.GenerateAccessToken(user);

        context.RefreshTokens.Add(newRefreshToken);
        await context.SaveChangesAsync(ct);

        UserDto userDto = new(user.Id, user.Email, user.Username, user.AvatarUrl);
        return Result.Success(new AuthResult(
            userDto,
            newAccessToken,
            newRefreshToken.Token,
            newRefreshToken.ExpiresAt));
    }
}
