using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Mappings;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Messages.Queries.SearchMessages;

public record SearchMessagesQuery(
    Guid UserId,
    string Query,
    Guid? ChannelId = null,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<MessageDto>>>;

public class SearchMessagesQueryValidator : AbstractValidator<SearchMessagesQuery>
{
    public SearchMessagesQueryValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
        RuleFor(x => x.Query)
            .NotEmpty().WithMessage("Search query cannot be empty.")
            .MaximumLength(200).WithMessage("Search query cannot exceed 200 characters.");
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1.");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50).WithMessage("PageSize must be between 1 and 50.");
    }
}

public class SearchMessagesQueryHandler(
    IApplicationDbContext context,
    IObjectStorageService storage)
    : IRequestHandler<SearchMessagesQuery, Result<PaginatedList<MessageDto>>>
{
    public async Task<Result<PaginatedList<MessageDto>>> Handle(SearchMessagesQuery request, CancellationToken ct)
    {
        if (request.ChannelId.HasValue)
        {
            bool isMember = await context.ChannelMembers
                .AsNoTracking()
                .AnyAsync(m => m.ChannelId == request.ChannelId.Value && m.UserId == request.UserId && !m.Channel.IsDeleted, ct);

            if (!isMember)
            {
                return Result.Failure<PaginatedList<MessageDto>>(
                    Error.Forbidden("Channel.NotMember", "You are not authorized to search messages in this channel."));
            }
        }

        string lowerQuery = request.Query.Trim().ToLower();

        var query = context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.ParentMessage)
                .ThenInclude(p => p!.Sender)
            .Include(m => m.Attachments)
            .Where(m => !m.IsDeleted && !m.Channel.IsDeleted && !m.Channel.IsSecret);

        if (request.ChannelId.HasValue)
        {
            query = query.Where(m => m.ChannelId == request.ChannelId.Value);
        }
        else
        {
            query = query.Where(m => m.Channel.Members.Any(member => member.UserId == request.UserId));
        }

        query = query.Where(m => m.Content.ToLower().Contains(lowerQuery));

        PaginatedList<Message> paginatedMessages = await query
            .OrderByDescending(m => m.CreatedAt)
            .ToPaginatedListAsync(request.Page, request.PageSize, ct);

        List<MessageDto> dtos = paginatedMessages.Items.Select(m => m.ToDto(storage)).ToList();

        return Result.Success(new PaginatedList<MessageDto>(
            dtos,
            paginatedMessages.TotalCount,
            paginatedMessages.PageNumber,
            request.PageSize));
    }
}

