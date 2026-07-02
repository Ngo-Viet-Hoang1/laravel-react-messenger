using FluentAssertions;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Application.Messages.Queries.GetChannelMessages;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Xunit;

namespace MessengerApp.Application.UnitTests.Messages;

public class GetChannelMessagesQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly GetChannelMessagesQueryHandler _handler;

    public GetChannelMessagesQueryHandlerTests()
    {
        _handler = new GetChannelMessagesQueryHandler(_context);
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

        Result<List<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

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

        Result<List<MessageDto>> result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
        result.Value[0].Content.Should().Be("First message");
        result.Value[1].Content.Should().Be("Second message");
    }
}
