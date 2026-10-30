using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Channels.Commands.AddChannelMembers;

public record AddChannelMembersCommand(
    Guid ChannelId,
    Guid CurrentUserId,
    List<Guid> MemberIds) : IRequest<Result<int>>;

public class AddChannelMembersCommandValidator : AbstractValidator<AddChannelMembersCommand>
{
    public AddChannelMembersCommandValidator()
    {
        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("Current user ID is required.");

        RuleFor(x => x.MemberIds)
            .NotEmpty().WithMessage("At least one member ID is required.");

        RuleForEach(x => x.MemberIds)
            .NotEmpty().WithMessage("Member ID cannot be empty.");
    }
}

public class AddChannelMembersCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddChannelMembersCommand, Result<int>>
{
    public async Task<Result<int>> Handle(AddChannelMembersCommand command, CancellationToken ct)
    {
        Channel? channel = await context.Channels
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == command.ChannelId && !c.IsDeleted, ct);

        if (channel == null)
        {
            return Result.Failure<int>(
                Error.NotFound("Channel.NotFound", "The requested channel does not exist or has been deleted."));
        }

        if (channel.Type != ChannelType.Group)
        {
            return Result.Failure<int>(
                Error.Validation("Channel.DirectCannotAddMembers", "Members cannot be added to a direct message channel."));
        }

        ChannelMember? caller = channel.Members.FirstOrDefault(m => m.UserId == command.CurrentUserId);
        if (caller == null)
        {
            return Result.Failure<int>(
                Error.Forbidden("Channel.AccessDenied", "You are not a member of this channel."));
        }

        HashSet<Guid> existingMemberIds = channel.Members.Select(m => m.UserId).ToHashSet();
        List<Guid> candidateIds = command.MemberIds.Distinct().Where(id => !existingMemberIds.Contains(id)).ToList();

        if (candidateIds.Count == 0)
        {
            return Result.Success(0);
        }

        List<Guid> validUserIds = await context.Users
            .Where(u => candidateIds.Contains(u.Id) && !u.IsDeleted)
            .Select(u => u.Id)
            .ToListAsync(ct);

        if (validUserIds.Count == 0)
        {
            return Result.Success(0);
        }

        foreach (Guid userId in validUserIds)
        {
            ChannelMember? member = channel.AddMember(userId, ChannelMemberRole.Member);
            if (member != null)
            {
                context.ChannelMembers.Add(member);
            }
        }

        await context.SaveChangesAsync(ct);
        return Result.Success(validUserIds.Count);
    }
}
