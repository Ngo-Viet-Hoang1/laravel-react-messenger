using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.DeleteChannel;

public record DeleteChannelCommand(Guid ChannelId, Guid CurrentUserId) : IRequest<Result>;

public class DeleteChannelCommandValidator : AbstractValidator<DeleteChannelCommand>
{
    public DeleteChannelCommandValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");
    }
}

public class DeleteChannelCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteChannelCommand, Result>
{
    public async Task<Result> Handle(DeleteChannelCommand command, CancellationToken ct)
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
                Error.Validation("Channel.DirectCannotDelete", "Direct message conversations cannot be deleted."));
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
                Error.Forbidden("Channel.OnlyOwnerCanDelete", "Only the channel owner has permission to delete this channel."));
        }

        channel.IsDeleted = true;
        channel.DeletedAt = DateTimeOffset.UtcNow;
        channel.DeletedBy = command.CurrentUserId.ToString();

        await context.SaveChangesAsync(ct);

        return Result.Success();
    }
}
