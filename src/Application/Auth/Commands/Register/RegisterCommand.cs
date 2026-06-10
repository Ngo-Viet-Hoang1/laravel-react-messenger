using MediatR;
using MessengerApp.Domain.Common;

namespace MessengerApp.Application.Auth.Commands.Register;

public record RegisterCommand(
    string Email,
    string Username,
    string Password,
    string? AvatarUrl = null
) : IRequest<Result<RegisterResult>>;

public record RegisterResult(
    Guid UserId,
    string Email,
    string Username
);
