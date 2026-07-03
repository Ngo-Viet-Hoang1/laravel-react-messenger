using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.LeaveChannel;

public record LeaveChannelCommand(Guid ChannelId, Guid CurrentUserId) : IRequest<Result>;

public class LeaveChannelCommandValidator : AbstractValidator<LeaveChannelCommand>
{
    public LeaveChannelCommandValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");
    }
}

public class LeaveChannelCommandHandler(IApplicationDbContext context)
    : IRequestHandler<LeaveChannelCommand, Result>
{
    public async Task<Result> Handle(LeaveChannelCommand command, CancellationToken ct)
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
                Error.Validation("Channel.DirectCannotLeave", "You cannot leave a direct message conversation."));
        }

        ChannelMember? member = channel.Members.FirstOrDefault(m => m.UserId == command.CurrentUserId);
        if (member == null)
        {
            return Result.Failure(
                Error.Forbidden("Channel.AccessDenied", "You are not a member of this channel."));
        }

        // Owner edge cases:
        if (member.Role == ChannelMemberRole.Owner)
        {
            // If Owner is the sole member, leaving deletes the channel
            if (channel.Members.Count <= 1)
            {
                channel.IsDeleted = true;
                channel.DeletedAt = DateTimeOffset.UtcNow;
                channel.DeletedBy = command.CurrentUserId.ToString();
                context.ChannelMembers.Remove(member);
                await context.SaveChangesAsync(ct);
                return Result.Success();
            }

            // If other members exist, Owner must transfer ownership or delete channel
            return Result.Failure(
                Error.Validation("Channel.OwnerCannotLeave", "As the owner, you must transfer ownership or delete the channel before leaving."));
        }

        context.ChannelMembers.Remove(member);
        await context.SaveChangesAsync(ct);

        return Result.Success();
    }
}
