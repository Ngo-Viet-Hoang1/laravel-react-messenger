using System.ComponentModel.DataAnnotations.Schema;
using MessengerApp.Domain.Common.Contracts;

namespace MessengerApp.Domain.Common;

public abstract class BaseEntity<TId> : IEntity<TId>
{
    public TId Id { get; set; } = default!;

    private readonly List<object> _domainEvents = [];

    [NotMapped]
    public IReadOnlyCollection<object> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(object domainEvent) => _domainEvents.Add(domainEvent);
    public void RemoveDomainEvent(object domainEvent) => _domainEvents.Remove(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}

public abstract class BaseEntity : BaseEntity<Guid>, IEntity
{
    protected BaseEntity()
    {
        Id = Guid.NewGuid();
    }
}
