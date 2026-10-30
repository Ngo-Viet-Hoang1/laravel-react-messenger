using FluentValidation;
using MediatR;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Queries.GetChannelMembers;

public record GetChannelMembersQuery(Guid ChannelId, Guid CurrentUserId) : IRequest<Result<List<ChannelMemberDto>>>;

public class GetChannelMembersQueryValidator : AbstractValidator<GetChannelMembersQuery>
{
    public GetChannelMembersQueryValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");
    }
}

public class GetChannelMembersQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetChannelMembersQuery, Result<List<ChannelMemberDto>>>
{
    public async Task<Result<List<ChannelMemberDto>>> Handle(GetChannelMembersQuery query, CancellationToken ct)
    {
        Channel? channel = await context.Channels
            .AsNoTracking()
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(c => c.Id == query.ChannelId && !c.IsDeleted, ct);

        if (channel == null)
        {
            return Result.Failure<List<ChannelMemberDto>>(
                Error.NotFound("Channel.NotFound", "The requested channel does not exist or has been deleted."));
        }

        bool isMember = channel.Members.Any(m => m.UserId == query.CurrentUserId);
        if (!isMember)
        {
            return Result.Failure<List<ChannelMemberDto>>(
                Error.Forbidden("Channel.AccessDenied", "You are not a member of this channel."));
        }

        List<ChannelMemberDto> dtos = channel.Members
            .OrderBy(m => m.Role)
            .ThenBy(m => m.User?.Username ?? string.Empty)
            .Select(m => m.ToMemberDto())
            .ToList();

        return Result.Success(dtos);
    }
}
