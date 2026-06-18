using FluentValidation;
using MediatR;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.GetOrCreateDirectChannel;

public record GetOrCreateDirectChannelCommand(
    Guid CurrentUserId,
    Guid TargetUserId
) : IRequest<Result<ChannelDetailDto>>;

public class GetOrCreateDirectChannelCommandValidator : AbstractValidator<GetOrCreateDirectChannelCommand>
{
    public GetOrCreateDirectChannelCommandValidator()
    {
        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");

        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("Target user ID is required.")
            .Must((cmd, targetId) => cmd.CurrentUserId != targetId)
            .WithMessage("Cannot create a direct channel with yourself.");
    }
}

public class GetOrCreateDirectChannelCommandHandler(IApplicationDbContext context)
    : IRequestHandler<GetOrCreateDirectChannelCommand, Result<ChannelDetailDto>>
{
    public async Task<Result<ChannelDetailDto>> Handle(GetOrCreateDirectChannelCommand cmd, CancellationToken ct)
    {
        User? targetUser = await context.Users.FindAsync([cmd.TargetUserId], ct);
        if (targetUser == null || targetUser.IsDeleted)
        {
            return Result.Failure<ChannelDetailDto>(
                Error.NotFound("User.NotFound", "The target user does not exist or has been deactivated."));
        }

        Channel? existingChannel = await context.Channels
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .Where(c => c.Type == ChannelType.Direct && !c.IsDeleted)
            .Where(c => c.Members.Any(m => m.UserId == cmd.CurrentUserId) &&
                        c.Members.Any(m => m.UserId == cmd.TargetUserId))
            .FirstOrDefaultAsync(ct);

        if (existingChannel != null)
        {
            return Result.Success(existingChannel.ToDetailDto(cmd.CurrentUserId));
        }

        Channel channel = Channel.CreateDirect(cmd.CurrentUserId, cmd.TargetUserId);
        context.Channels.Add(channel);
        await context.SaveChangesAsync(ct);

        Channel createdChannel = await context.Channels
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .FirstAsync(c => c.Id == channel.Id, ct);

        return Result.Success(createdChannel.ToDetailDto(cmd.CurrentUserId));
    }
}
