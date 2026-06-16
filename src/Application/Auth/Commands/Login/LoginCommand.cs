using FluentValidation;
using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Auth.Commands.Login;

public record LoginCommand(
    string EmailOrUsername,
    string Password) : IRequest<Result<AuthResult>>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.EmailOrUsername)
            .NotEmpty().WithMessage("Email or username is required.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public class LoginCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    IClientInfoProvider clientInfoProvider) : IRequestHandler<LoginCommand, Result<AuthResult>>
{
    public async Task<Result<AuthResult>> Handle(LoginCommand cmd, CancellationToken ct)
    {
        string identifier = cmd.EmailOrUsername.Trim().ToLowerInvariant();

        User? user = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier, ct);

        if (user == null || !passwordHasher.VerifyPassword(cmd.Password, user.PasswordHash))
        {
            return Result.Failure<AuthResult>(
                Error.Unauthorized("Auth.InvalidCredentials", "Invalid email/username or password."));
        }

        user.UpdateLastSeen();

        string? clientIp = clientInfoProvider.ClientIpAddress;
        string accessToken = jwtTokenService.GenerateAccessToken(user);
        var refreshToken = jwtTokenService.GenerateRefreshToken(user.Id, clientIp);

        context.RefreshTokens.Add(refreshToken);
        await context.SaveChangesAsync(ct);

        UserDto userDto = new(user.Id, user.Email, user.Username, user.AvatarUrl);
        return Result.Success(new AuthResult(
            userDto,
            accessToken,
            refreshToken.Token,
            refreshToken.ExpiresAt));
    }
}
