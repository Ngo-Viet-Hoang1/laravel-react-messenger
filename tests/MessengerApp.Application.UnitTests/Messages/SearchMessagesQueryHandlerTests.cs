using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Application.Messages.Queries.SearchMessages;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Messages;

public class SearchMessagesQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IObjectStorageService _storage = Substitute.For<IObjectStorageService>();
    private readonly SearchMessagesQueryHandler _handler;

    public SearchMessagesQueryHandlerTests()
    {
        _handler = new SearchMessagesQueryHandler(_context, _storage);
    }

    [Fact]
    public async Task Handle_WhenChannelSpecifiedAndUserNotMember_ReturnsForbidden()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", Guid.NewGuid());
        _context.Users.Add(user);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        SearchMessagesQuery query = new(user.Id, "hello", channel.Id);

        Result<PaginatedList<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
        result.Error.Code.Should().Be("Channel.NotMember");
    }

    [Fact]
    public async Task Handle_WhenSearchingKeywordInChannel_ReturnsMatchingMessagesCaseInsensitive()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        Message msg1 = Message.Create(channel.Id, user.Id, "Deploying Kubernetes cluster to prod");
        msg1.CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-10);

        Message msg2 = Message.Create(channel.Id, user.Id, "Reviewing pull request for kubernetes config");
        msg2.CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5);

        Message msg3 = Message.Create(channel.Id, user.Id, "Totally unrelated message about lunch");
        msg3.CreatedAt = DateTimeOffset.UtcNow;

        _context.Messages.AddRange(msg1, msg2, msg3);
        await _context.SaveChangesAsync();

        // Search with uppercase query to verify case insensitivity
        SearchMessagesQuery query = new(user.Id, "KUBERNETES", channel.Id);

        Result<PaginatedList<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalCount.Should().Be(2);
        result.Value.Items.Should().HaveCount(2);
        result.Value.Items[0].Content.Should().Be(msg2.Content); // Newest first
        result.Value.Items[1].Content.Should().Be(msg1.Content);
    }

    [Fact]
    public async Task Handle_WhenSearchingGlobally_ReturnsMatchesOnlyFromJoinedChannels()
    {
        User alice = User.Create("alice@example.com", "alice", "hash");
        User bob = User.Create("bob@example.com", "bob", "hash");

        // Channel A (Alice is member)
        Channel channelA = Channel.CreateGroup("general", alice.Id);
        // Channel B (Alice is member)
        Channel channelB = Channel.CreateGroup("backend", alice.Id);
        // Channel C (Private channel: Alice is NOT member, Bob is)
        Channel channelC = Channel.CreateGroup("exec-secret", bob.Id);

        _context.Users.AddRange(alice, bob);
        _context.Channels.AddRange(channelA, channelB, channelC);

        Message msgA = Message.Create(channelA.Id, alice.Id, "Secrets in architecture docs");
        Message msgB = Message.Create(channelB.Id, alice.Id, "Keep database secrets safe");
        Message msgC = Message.Create(channelC.Id, bob.Id, "Top secret executive salaries");

        _context.Messages.AddRange(msgA, msgB, msgC);
        await _context.SaveChangesAsync();

        // Alice searches globally without ChannelId
        SearchMessagesQuery query = new(alice.Id, "secret", ChannelId: null);

        Result<PaginatedList<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalCount.Should().Be(2);
        result.Value.Items.Select(x => x.Id).Should().Contain(msgA.Id);
        result.Value.Items.Select(x => x.Id).Should().Contain(msgB.Id);
        result.Value.Items.Select(x => x.Id).Should().NotContain(msgC.Id); // Alice never sees channel C messages
    }

    [Fact]
    public async Task Handle_WhenNoMessagesMatchKeyword_ReturnsEmptyList()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        Message msg = Message.Create(channel.Id, user.Id, "Testing SignalR connection");
        _context.Messages.Add(msg);
        await _context.SaveChangesAsync();

        SearchMessagesQuery query = new(user.Id, "NonExistentWord12345", channel.Id);

        Result<PaginatedList<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalCount.Should().Be(0);
        result.Value.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_Pagination_ReturnsCorrectPageAndTotalCount()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        var messages = Enumerable.Range(1, 15).Select(i =>
        {
            var m = Message.Create(channel.Id, user.Id, $"Docker container update #{i}");
            m.CreatedAt = DateTimeOffset.UtcNow.AddMinutes(i);
            return m;
        }).ToList();

        _context.Messages.AddRange(messages);
        await _context.SaveChangesAsync();

        // Query page 2 with page size 5
        SearchMessagesQuery query = new(user.Id, "Docker", channel.Id, Page: 2, PageSize: 5);

        Result<PaginatedList<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalCount.Should().Be(15);
        result.Value.TotalPages.Should().Be(3);
        result.Value.PageNumber.Should().Be(2);
        result.Value.Items.Should().HaveCount(5);
        result.Value.HasPreviousPage.Should().BeTrue();
        result.Value.HasNextPage.Should().BeTrue();
    }
}

