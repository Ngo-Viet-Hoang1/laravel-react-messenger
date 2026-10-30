using FluentValidation;
using MediatR;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Queries.GetChannelById;

public record GetChannelByIdQuery(Guid ChannelId, Guid CurrentUserId) : IRequest<Result<ChannelDetailDto>>;

public class GetChannelByIdQueryValidator : AbstractValidator<GetChannelByIdQuery>
{
    public GetChannelByIdQueryValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");
    }
}

public class GetChannelByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetChannelByIdQuery, Result<ChannelDetailDto>>
{
    public async Task<Result<ChannelDetailDto>> Handle(GetChannelByIdQuery query, CancellationToken ct)
    {
        Channel? channel = await context.Channels
            .AsNoTracking()
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(c => c.Id == query.ChannelId && !c.IsDeleted, ct);

        if (channel == null)
        {
            return Result.Failure<ChannelDetailDto>(
                Error.NotFound("Channel.NotFound", "The requested channel does not exist or has been deleted."));
        }

        bool isMember = channel.Members.Any(m => m.UserId == query.CurrentUserId);
        if (!isMember)
        {
            return Result.Failure<ChannelDetailDto>(
                Error.Forbidden("Channel.AccessDenied", "You are not a member of this channel."));
        }

        return Result.Success(channel.ToDetailDto(query.CurrentUserId));
    }
}
