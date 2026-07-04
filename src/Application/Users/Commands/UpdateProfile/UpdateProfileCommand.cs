using FluentValidation;
using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Users.Commands.UpdateProfile;

public record UpdateProfileCommand(
    Guid UserId,
    string Username,
    string? AvatarUrl) : IRequest<Result<UserDto>>;

public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required.")
            .MinimumLength(2).WithMessage("Username must be at least 2 characters.")
            .MaximumLength(50).WithMessage("Username must not exceed 50 characters.")
            .Matches(@"^[a-zA-Z0-9_.]+$").WithMessage("Username can only contain alphanumeric characters, underscores, and dots.");

        RuleFor(x => x.AvatarUrl)
            .MaximumLength(2048).WithMessage("Avatar URL must not exceed 2048 characters.")
            .Must(url => string.IsNullOrEmpty(url) || Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("Avatar URL must be a valid absolute URL.");
    }
}

public class UpdateProfileCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateProfileCommand, Result<UserDto>>
{
    public async Task<Result<UserDto>> Handle(UpdateProfileCommand command, CancellationToken ct)
    {
        User? user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == command.UserId && !u.IsDeleted, ct);

        if (user == null)
        {
            return Result.Failure<UserDto>(
                Error.NotFound("User.NotFound", "The requested user account does not exist or has been deleted."));
        }

        string normalizedNewUsername = command.Username.Trim().ToLowerInvariant();
        string normalizedCurrentUsername = user.Username.Trim().ToLowerInvariant();

        if (normalizedNewUsername != normalizedCurrentUsername)
        {
            bool isTaken = await context.Users
                .AnyAsync(u => u.Id != command.UserId && u.Username.ToLower() == normalizedNewUsername && !u.IsDeleted, ct);

            if (isTaken)
            {
                return Result.Failure<UserDto>(
                    Error.Conflict("User.UsernameTaken", $"The username '{command.Username.Trim()}' is already taken by another account."));
            }
        }

        user.UpdateProfile(command.Username, command.AvatarUrl?.Trim());
        await context.SaveChangesAsync(ct);

        return Result.Success(user.ToDto());
    }
}
