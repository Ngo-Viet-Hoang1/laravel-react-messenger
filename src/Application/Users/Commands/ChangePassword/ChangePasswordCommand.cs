using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Users.Commands.ChangePassword;

public record ChangePasswordCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword) : IRequest<Result>;

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Current password is required.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(6).WithMessage("New password must be at least 6 characters.")
            .MaximumLength(100).WithMessage("New password must not exceed 100 characters.")
            .Must((cmd, newPwd) => newPwd != cmd.CurrentPassword)
            .WithMessage("New password must be different from current password.");
    }
}

public class ChangePasswordCommandHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher)
    : IRequestHandler<ChangePasswordCommand, Result>
{
    public async Task<Result> Handle(ChangePasswordCommand command, CancellationToken ct)
    {
        User? user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == command.UserId && !u.IsDeleted, ct);

        if (user == null)
        {
            return Result.Failure(
                Error.NotFound("User.NotFound", "The requested user account does not exist or has been deleted."));
        }

        bool isCurrentValid = passwordHasher.VerifyPassword(command.CurrentPassword, user.PasswordHash);
        if (!isCurrentValid)
        {
            return Result.Failure(
                Error.Validation("User.InvalidCurrentPassword", "The current password provided is incorrect."));
        }

        string newPasswordHash = passwordHasher.HashPassword(command.NewPassword);
        user.UpdatePassword(newPasswordHash);
        await context.SaveChangesAsync(ct);

        return Result.Success();
    }
}
