using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using MessengerApp.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MessengerApp.Infrastructure.Services.Storage;

public class S3ObjectStorageService(
    IAmazonS3 s3Client,
    IOptions<StorageOptions> options,
    ILogger<S3ObjectStorageService> logger) : IObjectStorageService
{
    private readonly StorageOptions _options = options.Value;
    private Protocol StorageProtocol => _options.ServiceUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
        ? Protocol.HTTPS
        : Protocol.HTTP;

    public string GeneratePresignedUploadUrl(string storageKey, string contentType, TimeSpan expiry)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.Add(expiry),
            ContentType = contentType,
            Protocol = StorageProtocol
        };

        return s3Client.GetPreSignedURL(request);
    }

    public async Task<InitiateMultipartResult> InitiateMultipartUploadAsync(
        string storageKey,
        string contentType,
        long fileSizeBytes,
        int partSizeBytes = 10 * 1024 * 1024,
        TimeSpan? expiry = null,
        CancellationToken ct = default)
    {
        var initiateRequest = new InitiateMultipartUploadRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey,
            ContentType = contentType
        };

        var initiateResponse = await s3Client.InitiateMultipartUploadAsync(initiateRequest, ct);
        string uploadId = initiateResponse.UploadId;

        int partCount = (int)Math.Ceiling((double)fileSizeBytes / partSizeBytes);
        if (partCount <= 0) partCount = 1;

        var parts = new List<PresignedUploadPart>(partCount);
        TimeSpan linkExpiry = expiry ?? TimeSpan.FromHours(2);

        for (int partNumber = 1; partNumber <= partCount; partNumber++)
        {
            var partRequest = new GetPreSignedUrlRequest
            {
                BucketName = _options.BucketName,
                Key = storageKey,
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.Add(linkExpiry),
                UploadId = uploadId,
                PartNumber = partNumber,
                Protocol = StorageProtocol
            };

            string uploadUrl = s3Client.GetPreSignedURL(partRequest);
            parts.Add(new PresignedUploadPart(partNumber, uploadUrl));
        }

        return new InitiateMultipartResult(uploadId, storageKey, parts);
    }

    public async Task CompleteMultipartUploadAsync(
        string storageKey,
        string uploadId,
        IEnumerable<CompletedPartDto> parts,
        CancellationToken ct = default)
    {
        var request = new CompleteMultipartUploadRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey,
            UploadId = uploadId,
            PartETags = parts
                .OrderBy(p => p.PartNumber)
                .Select(p => new PartETag(p.PartNumber, p.ETag.Trim('"')))
                .ToList()
        };

        await s3Client.CompleteMultipartUploadAsync(request, ct);
        logger.LogInformation("Completed multipart upload for object key {StorageKey}", storageKey);
    }

    public async Task AbortMultipartUploadAsync(
        string storageKey,
        string uploadId,
        CancellationToken ct = default)
    {
        var request = new AbortMultipartUploadRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey,
            UploadId = uploadId
        };

        await s3Client.AbortMultipartUploadAsync(request, ct);
        logger.LogInformation("Aborted multipart upload for object key {StorageKey}", storageKey);
    }

    public async Task<List<StoragePartDetail>> ListPartsAsync(
        string storageKey,
        string uploadId,
        CancellationToken ct = default)
    {
        var request = new ListPartsRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey,
            UploadId = uploadId
        };

        var response = await s3Client.ListPartsAsync(request, ct);

        return response.Parts
            .Select(p => new StoragePartDetail(
                p.PartNumber.GetValueOrDefault(),
                p.ETag?.Trim('"') ?? string.Empty,
                p.Size.GetValueOrDefault(),
                p.LastModified.GetValueOrDefault()))
            .ToList();
    }

    public string GeneratePresignedReadUrl(string storageKey, TimeSpan expiry, string? downloadFileName = null)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.Add(expiry),
            Protocol = StorageProtocol
        };

        if (!string.IsNullOrWhiteSpace(downloadFileName))
        {
            request.ResponseHeaderOverrides = new ResponseHeaderOverrides
            {
                ContentDisposition = $"attachment; filename=\"{downloadFileName}\""
            };
        }

        return s3Client.GetPreSignedURL(request);
    }

    public async Task DeleteObjectAsync(string storageKey, CancellationToken ct = default)
    {
        var request = new DeleteObjectRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey
        };

        await s3Client.DeleteObjectAsync(request, ct);
    }

    public async Task DeleteObjectsAsync(IEnumerable<string> storageKeys, CancellationToken ct = default)
    {
        var keyList = storageKeys.ToList();
        if (keyList.Count == 0) return;

        var request = new DeleteObjectsRequest
        {
            BucketName = _options.BucketName,
            Objects = keyList.Select(k => new KeyVersion { Key = k }).ToList()
        };

        await s3Client.DeleteObjectsAsync(request, ct);
    }

    public async Task EnsureBucketExistsAsync(CancellationToken ct = default)
    {
        bool exists = await AmazonS3Util.DoesS3BucketExistV2Async(s3Client, _options.BucketName);
        if (!exists)
        {
            logger.LogInformation("S3 Bucket {BucketName} does not exist. Creating now...", _options.BucketName);
            await s3Client.PutBucketAsync(new PutBucketRequest { BucketName = _options.BucketName }, ct);
        }
    }
}
