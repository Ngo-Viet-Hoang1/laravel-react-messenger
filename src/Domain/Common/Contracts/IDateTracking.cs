namespace MessengerApp.Domain.Common.Contracts;

public interface IDateTracking
{
    DateTimeOffset CreatedAt { get; set; }
    DateTimeOffset? LastModifiedAt { get; set; }
}
