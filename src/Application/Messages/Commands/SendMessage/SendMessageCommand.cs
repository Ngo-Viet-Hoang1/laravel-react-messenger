using FluentValidation;
using MediatR;
using MessengerApp.Application.Attachments.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Messages.Commands.SendMessage;

public record SendMessageCommand(
    Guid SenderId,
    Guid ChannelId,
    string? Content = null,
    string? ClientMessageId = null,
    Guid? ParentMessageId = null,
    List<Guid>? AttachmentIds = null
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
            .NotEmpty()
            .When(x => x.AttachmentIds == null || x.AttachmentIds.Count == 0)
            .WithMessage("Message content cannot be empty when there are no attachments.")
            .MaximumLength(5000).WithMessage("Message content cannot exceed 5000 characters.");

        RuleFor(x => x.ClientMessageId)
            .MaximumLength(64).WithMessage("Client message ID cannot exceed 64 characters.");

        RuleFor(x => x.AttachmentIds)
            .Must(ids => ids == null || ids.Count <= 10)
            .WithMessage("Cannot attach more than 10 files per message.");
    }
}

public class SendMessageCommandHandler(
    IApplicationDbContext context,
    IObjectStorageService storage)
    : IRequestHandler<SendMessageCommand, Result<MessageDto>>
{
    public async Task<Result<MessageDto>> Handle(SendMessageCommand cmd, CancellationToken ct)
    {
        Channel? channel = await context.Channels
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == cmd.ChannelId && !c.IsDeleted, ct);

        if (channel == null || !channel.Members.Any(m => m.UserId == cmd.SenderId))
        {
            return Result.Failure<MessageDto>(
                Error.Forbidden("Channel.NotMember", "You are not authorized to send messages to this channel."));
        }

        Message? parentMessage = null;
        if (cmd.ParentMessageId.HasValue)
        {
            parentMessage = await context.Messages
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.Id == cmd.ParentMessageId.Value, ct);

            if (parentMessage == null || parentMessage.IsDeleted)
            {
                return Result.Failure<MessageDto>(
                    Error.NotFound("Message.ParentNotFound", "The message you are replying to was not found or has been deleted."));
            }

            if (parentMessage.ChannelId != cmd.ChannelId)
            {
                return Result.Failure<MessageDto>(
                    Error.Forbidden("Message.CrossChannelReplyForbidden", "Cannot reply to a message from a different channel."));
            }
        }

        if (!string.IsNullOrWhiteSpace(cmd.ClientMessageId))
        {
            Message? existing = await context.Messages
                .Include(m => m.Sender)
                .Include(m => m.ParentMessage)
                    .ThenInclude(p => p!.Sender)
                .Include(m => m.Attachments)
                .FirstOrDefaultAsync(
                    m => m.ChannelId == cmd.ChannelId &&
                         m.SenderId == cmd.SenderId &&
                         m.ClientMessageId == cmd.ClientMessageId,
                    ct);

            if (existing != null)
            {
                return Result.Success(existing.ToDto(storage));
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

        List<MessageAttachment> validAttachments = [];
        if (cmd.AttachmentIds != null && cmd.AttachmentIds.Count > 0)
        {
            validAttachments = await context.MessageAttachments
                .Where(a => cmd.AttachmentIds.Contains(a.Id) &&
                            a.ChannelId == cmd.ChannelId &&
                            a.IsUploadCompleted &&
                            a.MessageId == null)
                .ToListAsync(ct);

            if (validAttachments.Count != cmd.AttachmentIds.Count)
            {
                return Result.Failure<MessageDto>(
                    Error.Validation("Message.InvalidAttachments", "One or more attachments are invalid, not completed, or already linked."));
            }
        }

        Message message = Message.Create(cmd.ChannelId, cmd.SenderId, cmd.Content, cmd.ClientMessageId, cmd.ParentMessageId);
        context.Messages.Add(message);

        foreach (var att in validAttachments)
        {
            att.AssignToMessage(message.Id);
        }

        DateTimeOffset now = DateTimeOffset.UtcNow;
        channel.LastModifiedAt = now;
        ChannelMember? senderMember = channel.Members.FirstOrDefault(m => m.UserId == cmd.SenderId);
        senderMember?.MarkAsRead(now);

        await context.SaveChangesAsync(ct);

        return Result.Success(message.ToDto(sender, storage, parentMessage, validAttachments));
    }
}
