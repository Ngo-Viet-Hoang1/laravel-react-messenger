using MessengerApp.Domain.Common.Contracts;

namespace MessengerApp.Domain.Common;

public abstract class BaseAuditableEntity : BaseEntity, IAuditable
{
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? LastModifiedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? LastModifiedBy { get; set; }
}
