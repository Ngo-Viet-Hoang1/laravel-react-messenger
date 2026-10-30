namespace MessengerApp.Domain.Common.Contracts;

public interface IEntityAudit<TId> : IEntity<TId>, IAuditable
{
}

public interface IEntityAudit : IEntityAudit<Guid>, IEntity
{
}
