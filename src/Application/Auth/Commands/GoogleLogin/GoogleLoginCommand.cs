using System.Text.RegularExpressions;
using FluentValidation;
using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Auth.Commands.GoogleLogin;

using RefreshToken = MessengerApp.Domain.Entities.RefreshToken;

public record GoogleLoginCommand(string IdToken) : IRequest<Result<AuthResult>>;

public class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
{
    public GoogleLoginCommandValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty().WithMessage("Google ID token is required.");
    }
}

public class GoogleLoginCommandHandler(
    IApplicationDbContext context,
    IGoogleAuthService googleAuthService,
    IJwtTokenService jwtTokenService,
    IClientInfoProvider clientInfoProvider) : IRequestHandler<GoogleLoginCommand, Result<AuthResult>>
{
    public async Task<Result<AuthResult>> Handle(GoogleLoginCommand cmd, CancellationToken ct)
    {
        Result<GoogleUserPayload> validationResult = await googleAuthService.ValidateIdTokenAsync(cmd.IdToken, ct);
        if (validationResult.IsFailure)
        {
            return Result.Failure<AuthResult>(validationResult.Error);
        }

        GoogleUserPayload googlePayload = validationResult.Value;
        string emailNormalized = googlePayload.Email.Trim().ToLowerInvariant();

        User? user = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalized, ct);

        if (user == null)
        {
            string baseUsername = DeriveUsernameFromEmail(emailNormalized);
            string username = baseUsername;
            int counter = 1;
            while (await context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower(), ct))
            {
                username = $"{baseUsername}{counter++}";
            }

            string externalPasswordHash = $"EXTERNAL_GOOGLE_{Guid.NewGuid():N}";
            user = User.Create(emailNormalized, username, externalPasswordHash, googlePayload.Picture);
            context.Users.Add(user);
        }
        else
        {
            if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(googlePayload.Picture))
            {
                user.AvatarUrl = googlePayload.Picture;
            }

            // Auto-heal usernames corrupted by previous regex or containing excessive underscores
            if (user.Username.Contains("___"))
            {
                string baseUsername = DeriveUsernameFromEmail(emailNormalized);
                string candidate = baseUsername;
                int counter = 1;
                while (await context.Users.AnyAsync(u => u.Id != user.Id && u.Username.ToLower() == candidate.ToLower(), ct))
                {
                    candidate = $"{baseUsername}{counter++}";
                }
                user.Username = candidate;
            }
        }

        user.UpdateLastSeen();

        string? clientIp = clientInfoProvider.ClientIpAddress;
        string accessToken = jwtTokenService.GenerateAccessToken(user);
        RefreshToken refreshToken = jwtTokenService.GenerateRefreshToken(user.Id, clientIp);

        context.RefreshTokens.Add(refreshToken);
        await context.SaveChangesAsync(ct);

        UserDto userDto = new(user.Id, user.Email, user.Username, user.AvatarUrl);
        return Result.Success(new AuthResult(
            userDto,
            accessToken,
            refreshToken.Token,
            refreshToken.ExpiresAt));
    }

    private static string DeriveUsernameFromEmail(string email)
    {
        string prefix = email.Split('@')[0].Trim().ToLowerInvariant();
        string clean = Regex.Replace(prefix, @"[^a-z0-9_.-]", "");
        return clean.Length switch
        {
            < 3 => $"user_{Guid.NewGuid():N}"[..10],
            > 30 => clean[..30],
            _ => clean
        };
    }
}
