using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Messages.Commands.ToggleReaction;

public record ToggleReactionCommand(
    Guid UserId,
    Guid MessageId,
    string Emoji
) : IRequest<Result<ToggleReactionResponse>>;

public record ToggleReactionResponse(
    Guid MessageId,
    Guid ChannelId,
    List<ReactionGroupDto> Reactions
);

public class ToggleReactionCommandValidator : AbstractValidator<ToggleReactionCommand>
{
    public ToggleReactionCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
        RuleFor(x => x.MessageId).NotEmpty().WithMessage("Message ID is required.");
        RuleFor(x => x.Emoji)
            .NotEmpty().WithMessage("Emoji is required.")
            .MaximumLength(32).WithMessage("Emoji length cannot exceed 32 characters.");
    }
}

public class ToggleReactionCommandHandler(IApplicationDbContext context)
    : IRequestHandler<ToggleReactionCommand, Result<ToggleReactionResponse>>
{
    public async Task<Result<ToggleReactionResponse>> Handle(ToggleReactionCommand cmd, CancellationToken ct)
    {
        string emoji = cmd.Emoji.Trim();

        Message? message = await context.Messages
            .Include(m => m.Channel)
            .FirstOrDefaultAsync(m => m.Id == cmd.MessageId, ct);

        if (message == null || message.IsDeleted || message.Channel.IsDeleted)
        {
            return Result.Failure<ToggleReactionResponse>(
                Error.NotFound("Message.NotFound", "The message was not found or has been deleted."));
        }

        bool isMember = await context.ChannelMembers
            .AsNoTracking()
            .AnyAsync(m => m.ChannelId == message.ChannelId && m.UserId == cmd.UserId, ct);

        if (!isMember)
        {
            return Result.Failure<ToggleReactionResponse>(
                Error.Forbidden("Channel.NotMember", "You are not a member of this channel."));
        }

        MessageReaction? existing = await context.MessageReactions
            .FirstOrDefaultAsync(r => r.MessageId == message.Id && r.UserId == cmd.UserId && r.Emoji == emoji, ct);

        if (existing != null)
        {
            context.MessageReactions.Remove(existing);
        }
        else
        {
            MessageReaction reaction = MessageReaction.Create(message.Id, cmd.UserId, emoji);
            context.MessageReactions.Add(reaction);
        }

        await context.SaveChangesAsync(ct);

        List<ReactionGroupDto> groups = await context.MessageReactions
            .AsNoTracking()
            .Where(r => r.MessageId == message.Id)
            .GroupBy(r => r.Emoji)
            .Select(g => new ReactionGroupDto(
                g.Key,
                g.Count(),
                g.Select(r => r.UserId).ToList()))
            .ToListAsync(ct);

        return Result.Success(new ToggleReactionResponse(message.Id, message.ChannelId, groups));
    }
}
