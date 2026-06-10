using FluentValidation;
using MediatR;
using MessengerApp.Domain.Common;

namespace MessengerApp.Application.Auth.Commands.Login;

public record LoginCommand(
    string EmailOrUsername,
    string Password
) : IRequest<Result<LoginResult>>;

public record LoginResult(
    Guid UserId,
    string Email,
    string Username,
    string? AvatarUrl,
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAt
);

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.EmailOrUsername)
            .NotEmpty().WithMessage("Email or username is required.")
            .MaximumLength(256).WithMessage("Email or username must not exceed 256 characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MaximumLength(128).WithMessage("Password must not exceed 128 characters.");
    }
}
