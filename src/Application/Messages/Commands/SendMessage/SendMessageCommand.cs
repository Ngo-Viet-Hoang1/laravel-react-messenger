using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Messages.Commands.SendMessage;

public record SendMessageCommand(
    Guid SenderId,
    Guid ChannelId,
    string Content,
    string? ClientMessageId = null
) : IRequest<Result<MessageDto>>;

public class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.SenderId)
            .NotEmpty().WithMessage("Sender ID is required.");

        RuleFor(x => x.ChannelId)
            .NotEmpty().WithMessage("Channel ID is required.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Message content cannot be empty.")
            .MaximumLength(5000).WithMessage("Message content cannot exceed 5000 characters.");

        RuleFor(x => x.ClientMessageId)
            .MaximumLength(64).WithMessage("Client message ID cannot exceed 64 characters.");
    }
}

public class SendMessageCommandHandler(IApplicationDbContext context)
    : IRequestHandler<SendMessageCommand, Result<MessageDto>>
{
    public async Task<Result<MessageDto>> Handle(SendMessageCommand cmd, CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers
            .AsNoTracking()
            .AnyAsync(m => m.ChannelId == cmd.ChannelId && m.UserId == cmd.SenderId && !m.Channel.IsDeleted, ct);

        if (!isMember)
        {
            return Result.Failure<MessageDto>(
                Error.Forbidden("Channel.NotMember", "You are not authorized to send messages to this channel."));
        }

        if (!string.IsNullOrWhiteSpace(cmd.ClientMessageId))
        {
            Message? existing = await context.Messages
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(
                    m => m.ChannelId == cmd.ChannelId &&
                         m.SenderId == cmd.SenderId &&
                         m.ClientMessageId == cmd.ClientMessageId,
                    ct);

            if (existing != null)
            {
                return Result.Success(existing.ToDto());
            }
        }

        User? sender = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == cmd.SenderId, ct);

        if (sender == null)
        {
            return Result.Failure<MessageDto>(
                Error.NotFound("User.NotFound", "Sender user was not found."));
        }

        Message message = Message.Create(cmd.ChannelId, cmd.SenderId, cmd.Content, cmd.ClientMessageId);
        context.Messages.Add(message);
        await context.SaveChangesAsync(ct);

        return Result.Success(message.ToDto(sender));
    }
}
