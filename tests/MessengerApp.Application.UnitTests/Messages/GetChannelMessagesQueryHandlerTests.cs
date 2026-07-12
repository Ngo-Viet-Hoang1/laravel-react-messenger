using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Application.Messages.Queries.GetChannelMessages;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Messages;

public class GetChannelMessagesQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IObjectStorageService _storage = Substitute.For<IObjectStorageService>();
    private readonly GetChannelMessagesQueryHandler _handler;

    public GetChannelMessagesQueryHandlerTests()
    {
        _handler = new GetChannelMessagesQueryHandler(_context, _storage);
    }

    [Fact]
    public async Task Handle_WhenUserNotMemberOfChannel_ReturnsForbidden()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", Guid.NewGuid());
        _context.Users.Add(user);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        GetChannelMessagesQuery query = new(channel.Id, user.Id);

        Result<CursorPagedList<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
        result.Error.Code.Should().Be("Channel.NotMember");
    }

    [Fact]
    public async Task Handle_WhenUserIsMember_ReturnsMessagesOrderedByCreatedAt()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        Message msg1 = Message.Create(channel.Id, user.Id, "First message");
        msg1.CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5);
        Message msg2 = Message.Create(channel.Id, user.Id, "Second message");
        msg2.CreatedAt = DateTimeOffset.UtcNow;
        _context.Messages.AddRange(msg1, msg2);
        await _context.SaveChangesAsync();

        GetChannelMessagesQuery query = new(channel.Id, user.Id);

        Result<CursorPagedList<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(2);
        result.Value.Items[0].Content.Should().Be("First message");
        result.Value.Items[1].Content.Should().Be("Second message");
        result.Value.HasMore.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WithCursorAndLimit_ReturnsOlderMessagesAndCorrectHasMore()
    {
        User user = User.Create("bob@example.com", "bob", "hash");
        Channel channel = Channel.CreateGroup("dev", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        DateTimeOffset now = DateTimeOffset.UtcNow;
        Message msg1 = Message.Create(channel.Id, user.Id, "Msg 1 (Oldest)");
        msg1.CreatedAt = now.AddMinutes(-30);
        Message msg2 = Message.Create(channel.Id, user.Id, "Msg 2 (Middle)");
        msg2.CreatedAt = now.AddMinutes(-20);
        Message msg3 = Message.Create(channel.Id, user.Id, "Msg 3 (Newest)");
        msg3.CreatedAt = now.AddMinutes(-10);

        _context.Messages.AddRange(msg1, msg2, msg3);
        await _context.SaveChangesAsync();

        // 1. Initial page: limit = 2 (should fetch newest 2: msg2, msg3, with hasMore = true and nextCursor = msg2.CreatedAt)
        GetChannelMessagesQuery initialQuery = new(channel.Id, user.Id, Before: null, Limit: 2);
        Result<CursorPagedList<MessageDto>> page1Result = await _handler.Handle(initialQuery, CancellationToken.None);

        page1Result.IsSuccess.Should().BeTrue();
        page1Result.Value.Items.Should().HaveCount(2);
        page1Result.Value.Items[0].Content.Should().Be("Msg 2 (Middle)");
        page1Result.Value.Items[1].Content.Should().Be("Msg 3 (Newest)");
        page1Result.Value.HasMore.Should().BeTrue();
        page1Result.Value.NextCursor.Should().Be(msg2.CreatedAt);

        // 2. Fetch older page using before = nextCursor (should fetch msg1, hasMore = false)
        GetChannelMessagesQuery page2Query = new(channel.Id, user.Id, Before: page1Result.Value.NextCursor, Limit: 2);
        Result<CursorPagedList<MessageDto>> page2Result = await _handler.Handle(page2Query, CancellationToken.None);

        page2Result.IsSuccess.Should().BeTrue();
        page2Result.Value.Items.Should().HaveCount(1);
        page2Result.Value.Items[0].Content.Should().Be("Msg 1 (Oldest)");
        page2Result.Value.HasMore.Should().BeFalse();
        page2Result.Value.NextCursor.Should().BeNull();
    }
}
