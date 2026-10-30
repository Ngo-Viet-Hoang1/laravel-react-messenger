using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.UpdateChannelMemberRole;

public record UpdateChannelMemberRoleCommand(
    Guid ChannelId,
    Guid CurrentUserId,
    Guid TargetUserId,
    ChannelMemberRole NewRole) : IRequest<Result>;

public class UpdateChannelMemberRoleCommandValidator : AbstractValidator<UpdateChannelMemberRoleCommand>
{
    public UpdateChannelMemberRoleCommandValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");

        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("Target user ID is required.");

        RuleFor(x => x)
            .Must(x => x.CurrentUserId != x.TargetUserId)
            .WithMessage("You cannot modify your own role.");

        RuleFor(x => x.NewRole)
            .IsInEnum().WithMessage("Invalid role specified.")
            .Must(role => role == ChannelMemberRole.Admin || role == ChannelMemberRole.Member)
            .WithMessage("Only Admin and Member roles can be assigned. Ownership transfer is not supported via this command.");
    }
}

public class UpdateChannelMemberRoleCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateChannelMemberRoleCommand, Result>
{
    public async Task<Result> Handle(UpdateChannelMemberRoleCommand command, CancellationToken ct)
    {
        Channel? channel = await context.Channels
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == command.ChannelId && !c.IsDeleted, ct);

        if (channel == null)
        {
            return Result.Failure(
                Error.NotFound("Channel.NotFound", "The requested channel does not exist or has been deleted."));
        }

        if (channel.Type != ChannelType.Group)
        {
            return Result.Failure(
                Error.Validation("Channel.DirectCannotUpdateRole", "Member roles cannot be modified in direct message channels."));
        }

        ChannelMember? caller = channel.Members.FirstOrDefault(m => m.UserId == command.CurrentUserId);
        if (caller == null)
        {
            return Result.Failure(
                Error.Forbidden("Channel.AccessDenied", "You are not a member of this channel."));
        }

        if (caller.Role != ChannelMemberRole.Owner)
        {
            return Result.Failure(
                Error.Forbidden("Channel.NotAuthorized", "Only the channel owner can change member roles."));
        }

        ChannelMember? target = channel.Members.FirstOrDefault(m => m.UserId == command.TargetUserId);
        if (target == null)
        {
            return Result.Failure(
                Error.NotFound("Channel.TargetNotMember", "The specified user is not a member of this channel."));
        }

        if (target.Role == ChannelMemberRole.Owner)
        {
            return Result.Failure(
                Error.Forbidden("Channel.CannotModifyOwnerRole", "The channel owner's role cannot be modified."));
        }

        if (target.Role == command.NewRole)
        {
            return Result.Success();
        }

        target.UpdateRole(command.NewRole);
        await context.SaveChangesAsync(ct);

        return Result.Success();
    }
}
