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
    private const int MaxConcurrencyRetries = 3;

    public async Task<Result<ToggleReactionResponse>> Handle(ToggleReactionCommand cmd, CancellationToken ct)
    {
        string emoji = cmd.Emoji.Trim();

        for (int attempt = 1; attempt <= MaxConcurrencyRetries; attempt++)
        {
            try
            {
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

                message.ToggleReaction(cmd.UserId, emoji);

                // Saves changes: EF Core validates xmin concurrency token against PostgreSQL row version
                await context.SaveChangesAsync(ct);

                List<ReactionGroupDto> groups = message.Reactions
                    .Select(r => new ReactionGroupDto(r.Emoji, r.Count, r.UserIds))
                    .ToList();

                return Result.Success(new ToggleReactionResponse(message.Id, message.ChannelId, groups));
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxConcurrencyRetries)
            {
                // Concurrency conflict detected! Another concurrent request modified the Message row.
                // Clear ChangeTracker so the next iteration re-queries fresh state from DB.
                if (context is DbContext dbContext)
                {
                    dbContext.ChangeTracker.Clear();
                }

                // Exponential jitter delay
                await Task.Delay(10 * attempt, ct);
            }
        }

        return Result.Failure<ToggleReactionResponse>(
            Error.Conflict("Message.ConcurrencyConflict", "Could not complete reaction update due to concurrent modifications. Please try again."));
    }
}
