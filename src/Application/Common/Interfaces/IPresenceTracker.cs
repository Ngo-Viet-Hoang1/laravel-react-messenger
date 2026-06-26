namespace MessengerApp.Application.Common.Interfaces;

public interface IPresenceTracker
{
    Task<bool> ConnectionOpenedAsync(Guid userId, string connectionId);

    Task<bool> ConnectionClosedAsync(Guid userId, string connectionId);

    Task<IReadOnlyCollection<Guid>> GetOnlineUsersAsync();

    Task<bool> IsUserOnlineAsync(Guid userId);

    Task<IReadOnlyCollection<string>> GetConnectionsForUserAsync(Guid userId);
}
