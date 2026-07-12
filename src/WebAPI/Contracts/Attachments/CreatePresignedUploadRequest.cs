namespace MessengerApp.WebAPI.Contracts.Attachments;

public record CreatePresignedUploadRequest(
    string FileName,
    string ContentType,
    long FileSizeBytes,
    int? Width = null,
    int? Height = null,
    int? DurationSeconds = null,
    bool HasThumbnail = false
);
