using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.RemoveChannelMember;

public record RemoveChannelMemberCommand(
    Guid ChannelId,
    Guid CurrentUserId,
    Guid TargetUserId) : IRequest<Result>;

public class RemoveChannelMemberCommandValidator : AbstractValidator<RemoveChannelMemberCommand>
{
    public RemoveChannelMemberCommandValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");

        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("Target user ID is required.");

        RuleFor(x => x)
            .Must(x => x.CurrentUserId != x.TargetUserId)
            .WithMessage("You cannot kick yourself. Use the leave channel feature instead.");
    }
}

public class RemoveChannelMemberCommandHandler(IApplicationDbContext context)
    : IRequestHandler<RemoveChannelMemberCommand, Result>
{
    public async Task<Result> Handle(RemoveChannelMemberCommand command, CancellationToken ct)
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
                Error.Validation("Channel.DirectCannotRemoveMember", "Members cannot be removed from direct message channels."));
        }

        ChannelMember? caller = channel.Members.FirstOrDefault(m => m.UserId == command.CurrentUserId);
        if (caller == null)
        {
            return Result.Failure(
                Error.Forbidden("Channel.AccessDenied", "You are not a member of this channel."));
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
                Error.Forbidden("Channel.CannotRemoveOwner", "The channel owner cannot be removed from the channel."));
        }

        if (caller.Role == ChannelMemberRole.Member)
        {
            return Result.Failure(
                Error.Forbidden("Channel.NotAuthorized", "You do not have permission to remove members."));
        }

        if (caller.Role == ChannelMemberRole.Admin && target.Role == ChannelMemberRole.Admin)
        {
            return Result.Failure(
                Error.Forbidden("Channel.AdminCannotRemoveAdmin", "Administrators cannot remove other administrators."));
        }

        context.ChannelMembers.Remove(target);
        await context.SaveChangesAsync(ct);

        return Result.Success();
    }
}
