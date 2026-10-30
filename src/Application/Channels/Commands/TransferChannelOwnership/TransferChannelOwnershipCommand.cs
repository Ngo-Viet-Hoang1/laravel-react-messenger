using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.TransferChannelOwnership;

public record TransferChannelOwnershipCommand(
    Guid ChannelId,
    Guid CurrentUserId,
    Guid NewOwnerId) : IRequest<Result>;

public class TransferChannelOwnershipCommandValidator : AbstractValidator<TransferChannelOwnershipCommand>
{
    public TransferChannelOwnershipCommandValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");

        RuleFor(x => x.NewOwnerId)
            .NotEmpty().WithMessage("New owner user ID is required.");

        RuleFor(x => x)
            .Must(x => x.CurrentUserId != x.NewOwnerId)
            .WithMessage("You are already the channel owner.");
    }
}

public class TransferChannelOwnershipCommandHandler(IApplicationDbContext context)
    : IRequestHandler<TransferChannelOwnershipCommand, Result>
{
    public async Task<Result> Handle(TransferChannelOwnershipCommand command, CancellationToken ct)
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
                Error.Validation("Channel.DirectCannotTransferOwnership", "Ownership can only be transferred for group channels."));
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
                Error.Forbidden("Channel.NotAuthorized", "Only the current channel owner can transfer ownership."));
        }

        ChannelMember? newOwner = channel.Members.FirstOrDefault(m => m.UserId == command.NewOwnerId);
        if (newOwner == null)
        {
            return Result.Failure(
                Error.NotFound("Channel.TargetNotMember", "The specified user is not a member of this channel."));
        }

        caller.UpdateRole(ChannelMemberRole.Admin);
        newOwner.UpdateRole(ChannelMemberRole.Owner);

        await context.SaveChangesAsync(ct);

        return Result.Success();
    }
}
