using FluentAssertions;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Application.Messages.Queries.GetMessageContext;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Xunit;

namespace MessengerApp.Application.UnitTests.Messages;

public class GetMessageContextQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly GetMessageContextQueryHandler _handler;

    public GetMessageContextQueryHandlerTests()
    {
        _handler = new GetMessageContextQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WhenMessageNotFound_ReturnsNotFound()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        GetMessageContextQuery query = new(channel.Id, Guid.NewGuid(), user.Id, 20);
        Result<MessageContextDto> result = await _handler.Handle(query, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.NotFound);
        result.Error.Code.Should().Be("Message.NotFound");
    }

    [Fact]
    public async Task Handle_WhenUserNotChannelMember_ReturnsForbidden()
    {
        User alice = User.Create("alice@example.com", "alice", "hash");
        User bob = User.Create("bob@example.com", "bob", "hash");
        Channel channel = Channel.CreateGroup("dev-team", bob.Id); // Alice is NOT member

        _context.Users.AddRange(alice, bob);
        _context.Channels.Add(channel);

        Message msg = Message.Create(channel.Id, bob.Id, "Confidential roadmap discussion");
        _context.Messages.Add(msg);
        await _context.SaveChangesAsync();

        GetMessageContextQuery query = new(channel.Id, msg.Id, alice.Id, 20);
        Result<MessageContextDto> result = await _handler.Handle(query, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
        result.Error.Code.Should().Be("Channel.NotMember");
    }

    [Fact]
    public async Task Handle_WhenTargetMessageExists_ReturnsSurroundingContextOrderedChronologically()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        DateTimeOffset now = DateTimeOffset.UtcNow;
        List<Message> messages = new();

        for (int i = 0; i < 15; i++)
        {
            Message m = Message.Create(channel.Id, user.Id, $"Message #{i}");
            m.CreatedAt = now.AddMinutes(i * 2);
            messages.Add(m);
        }

        _context.Messages.AddRange(messages);
        await _context.SaveChangesAsync();

        Message targetMsg = messages[7];

        GetMessageContextQuery query = new(channel.Id, targetMsg.Id, user.Id, Limit: 6);
        Result<MessageContextDto> result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.TargetMessageId.Should().Be(targetMsg.Id);
        result.Value.Messages.Should().HaveCount(7);
        result.Value.Messages[3].Id.Should().Be(targetMsg.Id);
        result.Value.HasOlder.Should().BeTrue();
        result.Value.HasNewer.Should().BeTrue();

        for (int i = 0; i < result.Value.Messages.Count - 1; i++)
        {
            result.Value.Messages[i].CreatedAt.Should().BeBefore(result.Value.Messages[i + 1].CreatedAt);
        }
    }

    [Fact]
    public async Task Handle_WhenTargetMessageNotInSpecifiedChannel_ReturnsNotFound()
    {
        User user = User.Create("alice@example.com", "alice", "hash");
        Channel channel1 = Channel.CreateGroup("general", user.Id);
        Channel channel2 = Channel.CreateGroup("random", user.Id);
        _context.Users.Add(user);
        _context.Channels.AddRange(channel1, channel2);

        Message msg = Message.Create(channel1.Id, user.Id, "Message in channel 1");
        _context.Messages.Add(msg);
        await _context.SaveChangesAsync();

        GetMessageContextQuery query = new(channel2.Id, msg.Id, user.Id, 20);
        Result<MessageContextDto> result = await _handler.Handle(query, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.NotFound);
        result.Error.Code.Should().Be("Message.NotFound");
    }
}
