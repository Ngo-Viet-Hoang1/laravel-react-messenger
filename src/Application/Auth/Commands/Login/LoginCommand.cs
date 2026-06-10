using FluentValidation;
using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Auth.Commands.Login;

public record LoginCommand(
    string EmailOrUsername,
    string Password) : IRequest<Result<AuthResponse>>;

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
    IClientInfoProvider clientInfoProvider) : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var identifier = cmd.EmailOrUsername.Trim().ToLowerInvariant();

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier, ct);

        if (user == null || !passwordHasher.VerifyPassword(cmd.Password, user.PasswordHash))
        {
            return Result.Failure<AuthResponse>(
                Error.Unauthorized("Auth.InvalidCredentials", "Invalid email/username or password."));
        }

        user.UpdateLastSeen();

        var clientIp = clientInfoProvider.ClientIpAddress;
        var accessToken = jwtTokenService.GenerateAccessToken(user);
        var refreshToken = jwtTokenService.GenerateRefreshToken(user.Id, clientIp);

        context.RefreshTokens.Add(refreshToken);
        await context.SaveChangesAsync(ct);

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
