using FluentValidation;
using MediatR;
using MessengerApp.Application.Attachments.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Attachments.Commands.CreatePresignedUpload;

public record CreatePresignedUploadCommand(
    Guid ChannelId,
    Guid UserId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    int? Width = null,
    int? Height = null,
    int? DurationSeconds = null,
    bool HasThumbnail = false
) : IRequest<Result<PresignedUploadResultDto>>;

public class CreatePresignedUploadCommandValidator : AbstractValidator<CreatePresignedUploadCommand>
{
    private const long MaxVideoFileSizeBytes = 100L * 1024 * 1024; // 100 MB
    private const long MaxGeneralFileSizeBytes = 500L * 1024 * 1024; // 500 MB

    public CreatePresignedUploadCommandValidator()
    {
        RuleFor(x => x.ChannelId).NotEmpty().WithMessage("Channel ID is required.");
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255).WithMessage("File name is invalid.");
        RuleFor(x => x.ContentType).NotEmpty().MaximumLength(128).WithMessage("Content type is invalid.");

        RuleFor(x => x)
            .Must(x =>
            {
                if (x.FileSizeBytes <= 0) return false;
                bool isVideo = x.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase);
                long limit = isVideo ? MaxVideoFileSizeBytes : MaxGeneralFileSizeBytes;
                return x.FileSizeBytes <= limit;
            })
            .WithMessage("File size exceeds the allowed limit (100MB for video, 500MB for other files).");
    }
}

public class CreatePresignedUploadCommandHandler(
    IApplicationDbContext context,
    IObjectStorageService storage)
    : IRequestHandler<CreatePresignedUploadCommand, Result<PresignedUploadResultDto>>
{
    private const long MultipartThresholdBytes = 10L * 1024 * 1024; // 10 MB
    private const int PartSizeBytes = 10 * 1024 * 1024; // 10 MB per part

    public async Task<Result<PresignedUploadResultDto>> Handle(
        CreatePresignedUploadCommand cmd,
        CancellationToken ct)
    {
        bool isMember = await context.ChannelMembers
            .AnyAsync(m => m.ChannelId == cmd.ChannelId && m.UserId == cmd.UserId, ct);

        if (!isMember)
        {
            return Result.Failure<PresignedUploadResultDto>(
                Error.Forbidden("Channel.NotMember", "You are not a member of this channel."));
        }

        string safeFileName = Path.GetFileName(cmd.FileName);
        string extension = Path.GetExtension(safeFileName).ToLowerInvariant();
        string uniqueId = Guid.NewGuid().ToString("N");
        string storageKey = $"channels/{cmd.ChannelId}/{uniqueId}{extension}";

        string? thumbnailStorageKey = null;
        string? thumbnailUploadUrl = null;

        if (cmd.HasThumbnail || cmd.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
        {
            thumbnailStorageKey = $"channels/{cmd.ChannelId}/thumbnails/{uniqueId}.webp";
            thumbnailUploadUrl = storage.GeneratePresignedUploadUrl(
                thumbnailStorageKey,
                "image/webp",
                TimeSpan.FromHours(2));
        }

        bool isMultipart = cmd.FileSizeBytes >= MultipartThresholdBytes;
        string? uploadId = null;
        string? uploadUrl = null;
        int? partSize = null;
        List<PresignedPartDto>? parts = null;

        if (isMultipart)
        {
            var multipartResult = await storage.InitiateMultipartUploadAsync(
                storageKey,
                cmd.ContentType,
                cmd.FileSizeBytes,
                PartSizeBytes,
                TimeSpan.FromHours(2),
                ct);

            uploadId = multipartResult.UploadId;
            partSize = PartSizeBytes;
            parts = multipartResult.Parts
                .Select(p => new PresignedPartDto(p.PartNumber, p.UploadUrl))
                .ToList();
        }
        else
        {
            uploadUrl = storage.GeneratePresignedUploadUrl(
                storageKey,
                cmd.ContentType,
                TimeSpan.FromHours(2));
        }

        var attachment = MessageAttachment.Create(
            cmd.ChannelId,
            safeFileName,
            storageKey,
            cmd.ContentType,
            cmd.FileSizeBytes,
            s3UploadId: uploadId,
            thumbnailStorageKey: thumbnailStorageKey,
            width: cmd.Width,
            height: cmd.Height,
            durationSeconds: cmd.DurationSeconds);

        context.MessageAttachments.Add(attachment);
        await context.SaveChangesAsync(ct);

        return Result.Success(new PresignedUploadResultDto(
            attachment.Id,
            storageKey,
            IsMultipart: isMultipart,
            UploadUrl: uploadUrl,
            UploadId: uploadId,
            PartSizeBytes: partSize,
            Parts: parts,
            ThumbnailUploadUrl: thumbnailUploadUrl,
            ThumbnailStorageKey: thumbnailStorageKey));
    }
}
