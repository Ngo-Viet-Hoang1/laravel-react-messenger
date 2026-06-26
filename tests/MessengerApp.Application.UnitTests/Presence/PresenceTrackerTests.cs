using FluentAssertions;
using MessengerApp.Infrastructure.Presence;
using Xunit;

namespace MessengerApp.Application.UnitTests.Presence;

public class PresenceTrackerTests
{
    private readonly PresenceTracker _sut = new();

    [Fact]
    public async Task ConnectionOpenedAsync_WhenFirstConnection_ReturnsTrueAndUserIsOnline()
    {
        Guid userId = Guid.NewGuid();
        string connectionId = "conn-1";

        bool isFirstConnection = await _sut.ConnectionOpenedAsync(userId, connectionId);
        bool isOnline = await _sut.IsUserOnlineAsync(userId);
        IReadOnlyCollection<Guid> onlineUsers = await _sut.GetOnlineUsersAsync();

        isFirstConnection.Should().BeTrue();
        isOnline.Should().BeTrue();
        onlineUsers.Should().Contain(userId);
    }

    [Fact]
    public async Task ConnectionOpenedAsync_WhenSecondTabOpened_ReturnsFalseAndTracksBothConnections()
    {
        Guid userId = Guid.NewGuid();
        string connection1 = "conn-1";
        string connection2 = "conn-2";

        bool firstResult = await _sut.ConnectionOpenedAsync(userId, connection1);
        bool secondResult = await _sut.ConnectionOpenedAsync(userId, connection2);
        IReadOnlyCollection<string> connections = await _sut.GetConnectionsForUserAsync(userId);

        firstResult.Should().BeTrue();
        secondResult.Should().BeFalse();
        connections.Should().HaveCount(2).And.Contain(new[] { connection1, connection2 });
    }

    [Fact]
    public async Task ConnectionClosedAsync_WhenClosingOneOfMultipleTabs_ReturnsFalseAndUserRemainsOnline()
    {
        Guid userId = Guid.NewGuid();
        string connection1 = "conn-1";
        string connection2 = "conn-2";

        await _sut.ConnectionOpenedAsync(userId, connection1);
        await _sut.ConnectionOpenedAsync(userId, connection2);

        bool isLastConnection = await _sut.ConnectionClosedAsync(userId, connection1);
        bool isOnline = await _sut.IsUserOnlineAsync(userId);
        IReadOnlyCollection<string> remainingConnections = await _sut.GetConnectionsForUserAsync(userId);

        isLastConnection.Should().BeFalse();
        isOnline.Should().BeTrue();
        remainingConnections.Should().ContainSingle().Which.Should().Be(connection2);
    }

    [Fact]
    public async Task ConnectionClosedAsync_WhenClosingLastTab_ReturnsTrueAndUserGoesOffline()
    {
        Guid userId = Guid.NewGuid();
        string connectionId = "conn-1";

        await _sut.ConnectionOpenedAsync(userId, connectionId);

        bool isLastConnection = await _sut.ConnectionClosedAsync(userId, connectionId);
        bool isOnline = await _sut.IsUserOnlineAsync(userId);
        IReadOnlyCollection<Guid> onlineUsers = await _sut.GetOnlineUsersAsync();

        isLastConnection.Should().BeTrue();
        isOnline.Should().BeFalse();
        onlineUsers.Should().NotContain(userId);
    }

    [Fact]
    public async Task ConnectionClosedAsync_WhenNonExistentUserOrConnection_ReturnsFalseGracefully()
    {
        Guid userId = Guid.NewGuid();
        string connectionId = "conn-999";

        bool isLastConnection = await _sut.ConnectionClosedAsync(userId, connectionId);

        isLastConnection.Should().BeFalse();
    }

    [Fact]
    public async Task ConcurrentConnections_MultipleUsersAndTabs_PreservesThreadSafety()
    {
        int userCount = 20;
        int tabsPerUser = 5;
        List<Guid> users = Enumerable.Range(0, userCount).Select(_ => Guid.NewGuid()).ToList();

        List<Task> openTasks = new();
        foreach (Guid user in users)
        {
            for (int tab = 0; tab < tabsPerUser; tab++)
            {
                string connId = $"conn-{user}-{tab}";
                openTasks.Add(Task.Run(async () => await _sut.ConnectionOpenedAsync(user, connId)));
            }
        }

        await Task.WhenAll(openTasks);

        IReadOnlyCollection<Guid> onlineSnapshot = await _sut.GetOnlineUsersAsync();
        onlineSnapshot.Should().HaveCount(userCount);

        List<Task> closeTasks = new();
        foreach (Guid user in users)
        {
            for (int tab = 0; tab < tabsPerUser; tab++)
            {
                string connId = $"conn-{user}-{tab}";
                closeTasks.Add(Task.Run(async () => await _sut.ConnectionClosedAsync(user, connId)));
            }
        }

        await Task.WhenAll(closeTasks);

        IReadOnlyCollection<Guid> finalSnapshot = await _sut.GetOnlineUsersAsync();
        finalSnapshot.Should().BeEmpty();
    }

    [Fact]
    public async Task ConnectionClosedAsync_WhenConnectionNotPresentInActiveSet_ReturnsFalseAndPreservesState()
    {
        Guid userId = Guid.NewGuid();
        string activeConn = "conn-active";
        string phantomConn = "conn-phantom";

        await _sut.ConnectionOpenedAsync(userId, activeConn);

        bool isLast = await _sut.ConnectionClosedAsync(userId, phantomConn);
        bool isOnline = await _sut.IsUserOnlineAsync(userId);
        IReadOnlyCollection<string> connections = await _sut.GetConnectionsForUserAsync(userId);

        isLast.Should().BeFalse();
        isOnline.Should().BeTrue();
        connections.Should().ContainSingle().Which.Should().Be(activeConn);
    }

    [Fact]
    public async Task ConnectionClosedAsync_WhenDuplicateConcurrentClose_OnlyOneReturnsTrue()
    {
        Guid userId = Guid.NewGuid();
        string connectionId = "conn-single";

        await _sut.ConnectionOpenedAsync(userId, connectionId);

        List<Task<bool>> closeTasks = Enumerable.Range(0, 10)
            .Select(_ => Task.Run(() => _sut.ConnectionClosedAsync(userId, connectionId)))
            .ToList();

        bool[] results = await Task.WhenAll(closeTasks);

        results.Count(r => r).Should().Be(1);
        results.Count(r => !r).Should().Be(9);

        bool isOnline = await _sut.IsUserOnlineAsync(userId);
        isOnline.Should().BeFalse();
    }
}
