using MediatR;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Queries.GetUserChannels;

public record GetUserChannelsQuery(Guid UserId) : IRequest<Result<List<ChannelSummaryDto>>>;

public class GetUserChannelsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetUserChannelsQuery, Result<List<ChannelSummaryDto>>>
{
    public async Task<Result<List<ChannelSummaryDto>>> Handle(GetUserChannelsQuery query, CancellationToken ct)
    {
        List<Channel> channels = await context.Channels
            .AsNoTracking()
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .Where(c => !c.IsDeleted && c.Members.Any(m => m.UserId == query.UserId))
            .OrderByDescending(c => c.LastModifiedAt ?? c.CreatedAt)
            .ToListAsync(ct);

        List<Guid> channelIds = channels.Select(c => c.Id).ToList();
        Dictionary<Guid, int> unreadCounts = new();

        if (channelIds.Count > 0)
        {
            unreadCounts = await context.Messages
                .AsNoTracking()
                .Where(m => channelIds.Contains(m.ChannelId) && m.SenderId != query.UserId)
                .Join(
                    context.ChannelMembers.Where(cm => cm.UserId == query.UserId),
                    m => m.ChannelId,
                    cm => cm.ChannelId,
                    (m, cm) => new { m.ChannelId, m.CreatedAt, cm.LastReadAt }
                )
                .Where(x => x.LastReadAt == null || x.CreatedAt > x.LastReadAt.Value)
                .GroupBy(x => x.ChannelId)
                .Select(g => new { ChannelId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ChannelId, x => x.Count, ct);
        }

        List<ChannelSummaryDto> dtos = channels
            .Select(c => c.ToSummaryDto(query.UserId, unreadCounts.GetValueOrDefault(c.Id, 0)))
            .ToList();

        return Result.Success(dtos);
    }
}
