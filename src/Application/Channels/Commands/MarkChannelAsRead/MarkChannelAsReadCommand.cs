using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.MarkChannelAsRead;

public record MarkChannelAsReadCommand(Guid ChannelId, Guid UserId) : IRequest<Result>;

public class MarkChannelAsReadCommandHandler(IApplicationDbContext context)
    : IRequestHandler<MarkChannelAsReadCommand, Result>
{
    public async Task<Result> Handle(MarkChannelAsReadCommand cmd, CancellationToken ct)
    {
        ChannelMember? member = await context.ChannelMembers
            .FirstOrDefaultAsync(m => m.ChannelId == cmd.ChannelId && m.UserId == cmd.UserId, ct);

        if (member == null)
        {
            return Result.Failure(Error.NotFound("Channel.NotMember", "You are not a member of this channel."));
        }

        member.MarkAsRead();
        await context.SaveChangesAsync(ct);

        return Result.Success();
    }
}
