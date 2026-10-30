using System.Collections.Concurrent;
using MessengerApp.Application.Common.Interfaces;

namespace MessengerApp.Infrastructure.Presence;

public class PresenceTracker : IPresenceTracker
{
    private readonly ConcurrentDictionary<Guid, HashSet<string>> _onlineUsers = new();

    public Task<bool> ConnectionOpenedAsync(Guid userId, string connectionId)
    {
        while (true)
        {
            bool isFirstConnection = false;
            HashSet<string> connections = _onlineUsers.GetOrAdd(userId, _ => new HashSet<string>());

            lock (connections)
            {
                if (!_onlineUsers.TryGetValue(userId, out HashSet<string>? current) || !ReferenceEquals(current, connections))
                {
                    continue;
                }

                if (connections.Count == 0)
                {
                    isFirstConnection = true;
                }

                connections.Add(connectionId);
                return Task.FromResult(isFirstConnection);
            }
        }
    }

    public Task<bool> ConnectionClosedAsync(Guid userId, string connectionId)
    {
        while (true)
        {
            if (!_onlineUsers.TryGetValue(userId, out HashSet<string>? connections))
            {
                return Task.FromResult(false);
            }

            lock (connections)
            {
                if (!_onlineUsers.TryGetValue(userId, out HashSet<string>? current) || !ReferenceEquals(current, connections))
                {
                    continue;
                }

                bool removed = connections.Remove(connectionId);
                if (!removed)
                {
                    return Task.FromResult(false);
                }

                if (connections.Count == 0)
                {
                    _onlineUsers.TryRemove(new KeyValuePair<Guid, HashSet<string>>(userId, connections));
                    return Task.FromResult(true);
                }

                return Task.FromResult(false);
            }
        }
    }

    public Task<IReadOnlyCollection<Guid>> GetOnlineUsersAsync()
    {
        List<Guid> onlineUserIds = new();

        foreach (KeyValuePair<Guid, HashSet<string>> entry in _onlineUsers)
        {
            lock (entry.Value)
            {
                if (entry.Value.Count > 0)
                {
                    onlineUserIds.Add(entry.Key);
                }
            }
        }

        return Task.FromResult<IReadOnlyCollection<Guid>>(onlineUserIds.ToArray());
    }

    public Task<bool> IsUserOnlineAsync(Guid userId)
    {
        if (_onlineUsers.TryGetValue(userId, out HashSet<string>? connections))
        {
            lock (connections)
            {
                return Task.FromResult(connections.Count > 0);
            }
        }

        return Task.FromResult(false);
    }

    public Task<IReadOnlyCollection<string>> GetConnectionsForUserAsync(Guid userId)
    {
        if (_onlineUsers.TryGetValue(userId, out HashSet<string>? connections))
        {
            lock (connections)
            {
                if (connections.Count > 0)
                {
                    return Task.FromResult<IReadOnlyCollection<string>>(connections.ToArray());
                }
            }
        }

        return Task.FromResult<IReadOnlyCollection<string>>(Array.Empty<string>());
    }
}
