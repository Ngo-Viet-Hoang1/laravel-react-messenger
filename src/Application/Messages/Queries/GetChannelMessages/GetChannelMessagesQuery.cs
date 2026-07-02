using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Messages.Queries.GetChannelMessages;

public record GetChannelMessagesQuery(Guid ChannelId, Guid UserId, int Limit = 50)
    : IRequest<Result<List<MessageDto>>>;

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
    : IRequestHandler<GetChannelMessagesQuery, Result<List<MessageDto>>>
{
    public async Task<Result<List<MessageDto>>> Handle(GetChannelMessagesQuery request, CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers
            .AsNoTracking()
            .AnyAsync(m => m.ChannelId == request.ChannelId && m.UserId == request.UserId && !m.Channel.IsDeleted, ct);

        if (!isMember)
        {
            return Result.Failure<List<MessageDto>>(
                Error.Forbidden("Channel.NotMember", "You are not authorized to view messages in this channel."));
        }

        List<Message> messages = await context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.ChannelId == request.ChannelId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(request.Limit)
            .ToListAsync(ct);

        messages.Reverse();

        List<MessageDto> dtos = messages.Select(m => m.ToDto()).ToList();
        return Result.Success(dtos);
    }
}
