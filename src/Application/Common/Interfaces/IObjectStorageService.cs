namespace MessengerApp.Application.Common.Interfaces;

public record PresignedUploadPart(int PartNumber, string UploadUrl);

public record InitiateMultipartResult(string UploadId, string StorageKey, List<PresignedUploadPart> Parts);

public record CompletedPartDto(int PartNumber, string ETag);

public record StoragePartDetail(int PartNumber, string ETag, long Size, DateTime LastModified);

public interface IObjectStorageService
{
    string GeneratePresignedUploadUrl(string storageKey, string contentType, TimeSpan expiry);

    Task<InitiateMultipartResult> InitiateMultipartUploadAsync(
        string storageKey,
        string contentType,
        long fileSizeBytes,
        int partSizeBytes = 10 * 1024 * 1024,
        TimeSpan? expiry = null,
        CancellationToken ct = default);

    Task CompleteMultipartUploadAsync(
        string storageKey,
        string uploadId,
        IEnumerable<CompletedPartDto> parts,
        CancellationToken ct = default);

    Task AbortMultipartUploadAsync(
        string storageKey,
        string uploadId,
        CancellationToken ct = default);

    Task<List<StoragePartDetail>> ListPartsAsync(
        string storageKey,
        string uploadId,
        CancellationToken ct = default);

    string GeneratePresignedReadUrl(string storageKey, TimeSpan expiry, string? downloadFileName = null);

    Task DeleteObjectAsync(string storageKey, CancellationToken ct = default);

    Task DeleteObjectsAsync(IEnumerable<string> storageKeys, CancellationToken ct = default);

    Task EnsureBucketExistsAsync(CancellationToken ct = default);
}
