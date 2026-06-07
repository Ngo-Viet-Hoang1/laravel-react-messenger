namespace MessengerApp.Domain.Common.Contracts;

public interface IUserTracking
{
    string? CreatedBy { get; set; }
    string? LastModifiedBy { get; set; }
}
