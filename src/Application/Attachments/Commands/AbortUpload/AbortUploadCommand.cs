using FluentValidation;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Application.Attachments.Commands.AbortUpload;

public record AbortUploadCommand(
    Guid ChannelId,
    Guid AttachmentId,
    Guid UserId
) : IRequest<Result>;

public class AbortUploadCommandValidator : AbstractValidator<AbortUploadCommand>
{
    public AbortUploadCommandValidator()
    {
        RuleFor(x => x.ChannelId).NotEmpty().WithMessage("Channel ID is required.");
        RuleFor(x => x.AttachmentId).NotEmpty().WithMessage("Attachment ID is required.");
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
    }
}

public class AbortUploadCommandHandler(
    IApplicationDbContext context,
    IObjectStorageService storage,
    ILogger<AbortUploadCommandHandler>? logger = null)
    : IRequestHandler<AbortUploadCommand, Result>
{
    public async Task<Result> Handle(AbortUploadCommand cmd, CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers
            .AnyAsync(m => m.ChannelId == cmd.ChannelId && m.UserId == cmd.UserId, ct);

        if (!isMember)
        {
            return Result.Failure(
                Error.Forbidden("Channel.NotMember", "You are not a member of this channel."));
        }

        MessageAttachment? attachment = await context.MessageAttachments
            .FirstOrDefaultAsync(a => a.Id == cmd.AttachmentId && a.ChannelId == cmd.ChannelId, ct);

        if (attachment == null)
        {
            return Result.Success(); // Idempotent abort: already removed
        }

        if (attachment.MessageId.HasValue)
        {
            return Result.Failure(
                Error.Validation("Attachment.AlreadyLinked", "Cannot abort an attachment that has already been linked to a message."));
        }

        if (!string.IsNullOrWhiteSpace(attachment.S3UploadId))
        {
            try
            {
                await storage.AbortMultipartUploadAsync(
                    attachment.StorageKey,
                    attachment.S3UploadId,
                    ct);
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Failed to abort multipart upload on S3 for key {StorageKey} and upload ID {UploadId}",
                    attachment.StorageKey, attachment.S3UploadId);
            }
        }
        else
        {
            try
            {
                await storage.DeleteObjectAsync(attachment.StorageKey, ct);
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Failed to delete storage object {StorageKey} during upload abort",
                    attachment.StorageKey);
            }
        }

        if (!string.IsNullOrWhiteSpace(attachment.ThumbnailStorageKey))
        {
            try
            {
                await storage.DeleteObjectAsync(attachment.ThumbnailStorageKey, ct);
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Failed to delete thumbnail object {ThumbnailStorageKey} during upload abort",
                    attachment.ThumbnailStorageKey);
            }
        }

        try
        {
            context.MessageAttachments.Remove(attachment);
            await context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            logger?.LogInformation(ex, "Attachment {AttachmentId} was already removed concurrently", attachment.Id);
        }

        return Result.Success();
    }
}
