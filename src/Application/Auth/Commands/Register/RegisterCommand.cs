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
) : IRequest<Result<AuthResult>>;

public class RegisterCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    IClientInfoProvider clientInfoProvider) : IRequestHandler<RegisterCommand, Result<AuthResult>>
{
    public async Task<Result<AuthResult>> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        string normalizedEmail = command.Email.Trim().ToLowerInvariant();
        string normalizedUsername = command.Username.Trim().ToLowerInvariant();

        bool emailExists = await context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            return Result.Failure<AuthResult>(
                Error.Conflict("User.EmailConflict", "An account with this email address already exists."));
        }

        bool usernameExists = await context.Users
            .AnyAsync(u => u.Username.ToLower() == normalizedUsername, cancellationToken);

        if (usernameExists)
        {
            return Result.Failure<AuthResult>(
                Error.Conflict("User.UsernameConflict", "This username is already taken."));
        }

        string passwordHash = passwordHasher.HashPassword(command.Password);
        User user = User.Create(command.Email, command.Username, passwordHash, command.AvatarUrl);

        string accessToken = jwtTokenService.GenerateAccessToken(user);
        var refreshToken = jwtTokenService.GenerateRefreshToken(user.Id, clientInfoProvider.ClientIpAddress);

        context.Users.Add(user);
        context.RefreshTokens.Add(refreshToken);
        await context.SaveChangesAsync(cancellationToken);

        UserDto userDto = user.ToDto();
        return Result.Success(new AuthResult(
            userDto,
            accessToken,
            refreshToken.Token,
            refreshToken.ExpiresAt));
    }
}
