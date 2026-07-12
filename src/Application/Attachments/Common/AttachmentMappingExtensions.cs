using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Entities;

namespace MessengerApp.Application.Attachments.Common;

public static class AttachmentMappingExtensions
{
    public static MessageAttachmentDto ToDto(
        this MessageAttachment attachment,
        IObjectStorageService storage,
        TimeSpan? expiry = null)
    {
        TimeSpan linkExpiry = expiry ?? TimeSpan.FromHours(2);

        // For inline media (images, videos, audio), omit attachment disposition so browsers can stream smoothly
        bool isInlineMedia = attachment.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
                             attachment.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase) ||
                             attachment.ContentType.StartsWith("audio/", StringComparison.OrdinalIgnoreCase);

        string? downloadName = isInlineMedia ? null : attachment.FileName;

        string url = storage.GeneratePresignedReadUrl(
            attachment.StorageKey,
            linkExpiry,
            downloadName);

        string? thumbnailUrl = !string.IsNullOrWhiteSpace(attachment.ThumbnailStorageKey)
            ? storage.GeneratePresignedReadUrl(attachment.ThumbnailStorageKey, linkExpiry)
            : null;

        return new MessageAttachmentDto(
            attachment.Id,
            attachment.ChannelId,
            attachment.MessageId,
            attachment.FileName,
            attachment.ContentType,
            attachment.FileSizeBytes,
            url,
            attachment.CreatedAt,
            thumbnailUrl,
            attachment.Width,
            attachment.Height,
            attachment.DurationSeconds);
    }

    public static List<MessageAttachmentDto> ToDtoList(
        this IEnumerable<MessageAttachment> attachments,
        IObjectStorageService storage,
        TimeSpan? expiry = null)
    {
        return attachments.Select(a => a.ToDto(storage, expiry)).ToList();
    }
}
