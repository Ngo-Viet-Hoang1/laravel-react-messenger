using FluentValidation;
using MediatR;
using MessengerApp.Application.Attachments.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Attachments.Commands.CompleteUpload;

public record CompletePartRequest(int PartNumber, string ETag);

public record CompleteUploadCommand(
    Guid ChannelId,
    Guid AttachmentId,
    Guid UserId,
    List<CompletePartRequest>? Parts = null
) : IRequest<Result<MessageAttachmentDto>>;

public class CompleteUploadCommandValidator : AbstractValidator<CompleteUploadCommand>
{
    public CompleteUploadCommandValidator()
    {
        RuleFor(x => x.ChannelId).NotEmpty().WithMessage("Channel ID is required.");
        RuleFor(x => x.AttachmentId).NotEmpty().WithMessage("Attachment ID is required.");
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
    }
}

public class CompleteUploadCommandHandler(
    IApplicationDbContext context,
    IObjectStorageService storage)
    : IRequestHandler<CompleteUploadCommand, Result<MessageAttachmentDto>>
{
    public async Task<Result<MessageAttachmentDto>> Handle(
        CompleteUploadCommand cmd,
        CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers
            .AnyAsync(m => m.ChannelId == cmd.ChannelId && m.UserId == cmd.UserId, ct);

        if (!isMember)
        {
            return Result.Failure<MessageAttachmentDto>(
                Error.Forbidden("Channel.NotMember", "You are not a member of this channel."));
        }

        MessageAttachment? attachment = await context.MessageAttachments
            .FirstOrDefaultAsync(a => a.Id == cmd.AttachmentId && a.ChannelId == cmd.ChannelId, ct);

        if (attachment == null)
        {
            return Result.Failure<MessageAttachmentDto>(
                Error.NotFound("Attachment.NotFound", "The specified attachment was not found."));
        }

        if (attachment.IsUploadCompleted)
        {
            return Result.Success(attachment.ToDto(storage));
        }

        if (!string.IsNullOrWhiteSpace(attachment.S3UploadId))
        {
            if (cmd.Parts == null || cmd.Parts.Count == 0)
            {
                return Result.Failure<MessageAttachmentDto>(
                    Error.Validation("Attachment.MissingParts", "Multipart upload requires at least one completed part."));
            }

            var completedParts = cmd.Parts
                .Select(p => new CompletedPartDto(p.PartNumber, p.ETag))
                .ToList();

            await storage.CompleteMultipartUploadAsync(
                attachment.StorageKey,
                attachment.S3UploadId,
                completedParts,
                ct);
        }

        attachment.MarkCompleted();
        await context.SaveChangesAsync(ct);

        return Result.Success(attachment.ToDto(storage));
    }
}
