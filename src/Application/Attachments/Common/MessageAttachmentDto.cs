namespace MessengerApp.Application.Attachments.Common;

public record MessageAttachmentDto(
    Guid Id,
    Guid ChannelId,
    Guid? MessageId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string Url,
    DateTimeOffset CreatedAt,
    string? ThumbnailUrl = null,
    int? Width = null,
    int? Height = null,
    int? DurationSeconds = null
);

public record AttachmentStreamUrlDto(
    Guid AttachmentId,
    string StreamUrl,
    DateTimeOffset ExpiresAt
);

public record PresignedPartDto(
    int PartNumber,
    string UploadUrl
);

public record PresignedUploadResultDto(
    Guid AttachmentId,
    string StorageKey,
    bool IsMultipart,
    string? UploadUrl,
    string? UploadId,
    int? PartSizeBytes,
    List<PresignedPartDto>? Parts,
    string? ThumbnailUploadUrl,
    string? ThumbnailStorageKey
);
