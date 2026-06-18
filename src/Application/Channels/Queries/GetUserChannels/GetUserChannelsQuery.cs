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

        List<ChannelSummaryDto> dtos = channels
            .Select(c => c.ToSummaryDto(query.UserId))
            .ToList();

        return Result.Success(dtos);
    }
}
