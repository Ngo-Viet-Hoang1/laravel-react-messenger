using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Messages.Queries.GetChannelMessages;

public record GetChannelMessagesQuery(
    Guid ChannelId,
    Guid UserId,
    DateTimeOffset? Before = null,
    int Limit = 50) : IRequest<Result<CursorPagedList<MessageDto>>>;

public class GetChannelMessagesQueryValidator : AbstractValidator<GetChannelMessagesQuery>
{
    public GetChannelMessagesQueryValidator()
    {
        RuleFor(x => x.ChannelId).NotEmpty().WithMessage("Channel ID is required.");
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
        RuleFor(x => x.Limit).InclusiveBetween(1, 100).WithMessage("Limit must be between 1 and 100.");
    }
}

public class GetChannelMessagesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetChannelMessagesQuery, Result<CursorPagedList<MessageDto>>>
{
    public async Task<Result<CursorPagedList<MessageDto>>> Handle(GetChannelMessagesQuery request, CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers
            .AsNoTracking()
            .AnyAsync(m => m.ChannelId == request.ChannelId && m.UserId == request.UserId && !m.Channel.IsDeleted, ct);

        if (!isMember)
        {
            return Result.Failure<CursorPagedList<MessageDto>>(
                Error.Forbidden("Channel.NotMember", "You are not authorized to view messages in this channel."));
        }

        var query = context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.ParentMessage)
                .ThenInclude(p => p!.Sender)
            .Where(m => m.ChannelId == request.ChannelId);

        if (request.Before.HasValue)
        {
            query = query.Where(m => m.CreatedAt < request.Before.Value);
        }

        // Fetch limit + 1 to determine HasMore without extra COUNT(*) query (Slack / Postgres best practice)
        List<Message> messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(request.Limit + 1)
            .ToListAsync(ct);

        bool hasMore = messages.Count > request.Limit;
        if (hasMore)
        {
            messages = messages.Take(request.Limit).ToList();
        }

        DateTimeOffset? nextCursor = hasMore && messages.Count > 0
            ? messages.Last().CreatedAt
            : null;

        // Return chronological order (oldest to newest)
        messages.Reverse();

        List<MessageDto> dtos = messages.Select(m => m.ToDto()).ToList();
        return Result.Success(new CursorPagedList<MessageDto>(dtos, nextCursor, hasMore));
    }
}
