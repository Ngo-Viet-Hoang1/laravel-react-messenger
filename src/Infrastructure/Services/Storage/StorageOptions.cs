namespace MessengerApp.Infrastructure.Services.Storage;

public class StorageOptions
{
    public const string SectionName = "Storage";

    public string ServiceUrl { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public bool ForcePathStyle { get; set; } = true;
    public string Region { get; set; } = "us-east-1";
    public string? PublicUrlPrefix { get; set; }
}
