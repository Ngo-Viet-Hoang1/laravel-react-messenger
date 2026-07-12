using MessengerApp.Domain.Common;

namespace MessengerApp.Domain.Entities;

public class MessageAttachment : BaseAuditableEntity
{
    public Guid ChannelId { get; set; }
    public Channel Channel { get; set; } = null!;

    public Guid? MessageId { get; set; }
    public Message? Message { get; set; }

    public string FileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    public string? S3UploadId { get; set; }
    public bool IsUploadCompleted { get; set; }

    public string? ThumbnailStorageKey { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public int? DurationSeconds { get; set; }

    public MessageAttachment() { }

    private MessageAttachment(
        Guid channelId,
        string fileName,
        string storageKey,
        string contentType,
        long fileSizeBytes,
        string? s3UploadId = null,
        string? thumbnailStorageKey = null,
        int? width = null,
        int? height = null,
        int? durationSeconds = null)
    {
        ChannelId = channelId;
        FileName = fileName;
        StorageKey = storageKey;
        ContentType = contentType;
        FileSizeBytes = fileSizeBytes;
        S3UploadId = s3UploadId;
        IsUploadCompleted = false;
        ThumbnailStorageKey = thumbnailStorageKey;
        Width = width;
        Height = height;
        DurationSeconds = durationSeconds;
    }

    public static MessageAttachment Create(
        Guid channelId,
        string fileName,
        string storageKey,
        string contentType,
        long fileSizeBytes,
        string? s3UploadId = null,
        string? thumbnailStorageKey = null,
        int? width = null,
        int? height = null,
        int? durationSeconds = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentType);
        if (channelId == Guid.Empty) throw new ArgumentException("ChannelId cannot be empty.", nameof(channelId));
        if (fileSizeBytes < 0) throw new ArgumentException("FileSizeBytes cannot be negative.", nameof(fileSizeBytes));

        return new MessageAttachment(
            channelId,
            fileName,
            storageKey,
            contentType,
            fileSizeBytes,
            s3UploadId,
            thumbnailStorageKey,
            width,
            height,
            durationSeconds);
    }

    public void MarkCompleted()
    {
        IsUploadCompleted = true;
    }

    public void AssignToMessage(Guid messageId)
    {
        if (messageId == Guid.Empty) throw new ArgumentException("MessageId cannot be empty.", nameof(messageId));
        MessageId = messageId;
    }
}
