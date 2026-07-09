using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Messages.Queries.GetMessageContext;

public record GetMessageContextQuery(
    Guid ChannelId,
    Guid MessageId,
    Guid UserId,
    int Limit = 40) : IRequest<Result<MessageContextDto>>;

public class GetMessageContextQueryValidator : AbstractValidator<GetMessageContextQuery>
{
    public GetMessageContextQueryValidator()
    {
        RuleFor(x => x.ChannelId).NotEmpty().WithMessage("Channel ID is required.");
        RuleFor(x => x.MessageId).NotEmpty().WithMessage("Message ID is required.");
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
        RuleFor(x => x.Limit).InclusiveBetween(10, 100).WithMessage("Limit must be between 10 and 100.");
    }
}

public class GetMessageContextQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetMessageContextQuery, Result<MessageContextDto>>
{
    public async Task<Result<MessageContextDto>> Handle(GetMessageContextQuery request, CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers.AsNoTracking()
            .AnyAsync(m => m.ChannelId == request.ChannelId && m.UserId == request.UserId && !m.Channel.IsDeleted, ct);

        if (!isMember)
        {
            return Result.Failure<MessageContextDto>(
                Error.Forbidden("Channel.NotMember", "You are not authorized to view messages in this channel."));
        }

        var baseQuery = context.Messages.AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.ParentMessage).ThenInclude(p => p!.Sender)
            .Where(m => m.ChannelId == request.ChannelId && !m.IsDeleted);

        var target = await baseQuery.FirstOrDefaultAsync(m => m.Id == request.MessageId, ct);
        if (target == null)
        {
            return Result.Failure<MessageContextDto>(
                Error.NotFound("Message.NotFound", "The requested message was not found in this channel or has been deleted."));
        }

        int half = request.Limit / 2;

        var older = await baseQuery
            .Where(m => m.CreatedAt < target.CreatedAt || (m.CreatedAt == target.CreatedAt && m.Id != target.Id))
            .OrderByDescending(m => m.CreatedAt)
            .Take(half + 1)
            .ToListAsync(ct);

        var newer = await baseQuery
            .Where(m => m.CreatedAt > target.CreatedAt || (m.CreatedAt == target.CreatedAt && m.Id != target.Id))
            .OrderBy(m => m.CreatedAt)
            .Take(half + 1)
            .ToListAsync(ct);

        bool hasOlder = older.Count > half;
        bool hasNewer = newer.Count > half;

        if (hasOlder) older.RemoveAt(older.Count - 1);
        if (hasNewer) newer.RemoveAt(newer.Count - 1);
        older.Reverse();

        var messages = older.Concat([target]).Concat(newer).Select(m => m.ToDto()).ToList();

        return Result.Success(new MessageContextDto(
            messages,
            target.Id,
            hasOlder,
            hasNewer,
            hasOlder && messages.Count > 0 ? messages.First().CreatedAt : null,
            hasNewer && messages.Count > 0 ? messages.Last().CreatedAt : null));
    }
}
