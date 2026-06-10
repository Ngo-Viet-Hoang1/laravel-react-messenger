using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Auth.Commands.Register;

public record RegisterCommand(
    string Email,
    string Username,
    string Password,
    string? AvatarUrl = null
) : IRequest<Result<AuthResponse>>;

public class RegisterCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    IClientInfoProvider clientInfoProvider) : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        var normalizedEmail = command.Email.Trim().ToLowerInvariant();
        var normalizedUsername = command.Username.Trim().ToLowerInvariant();

        var emailExists = await context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            return Result.Failure<AuthResponse>(
                Error.Conflict("User.EmailConflict", "An account with this email address already exists."));
        }

        var usernameExists = await context.Users
            .AnyAsync(u => u.Username.ToLower() == normalizedUsername, cancellationToken);

        if (usernameExists)
        {
            return Result.Failure<AuthResponse>(
                Error.Conflict("User.UsernameConflict", "This username is already taken."));
        }

        var passwordHash = passwordHasher.HashPassword(command.Password);
        var user = User.Create(command.Email, command.Username, passwordHash, command.AvatarUrl);

        var accessToken = jwtTokenService.GenerateAccessToken(user);
        var refreshToken = jwtTokenService.GenerateRefreshToken(user.Id, clientInfoProvider.ClientIpAddress);

        context.Users.Add(user);
        context.RefreshTokens.Add(refreshToken);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success(new AuthResponse(
            user.Id,
            user.Email,
            user.Username,
            user.AvatarUrl,
            accessToken,
            refreshToken.Token,
            refreshToken.ExpiresAt));
    }
}
