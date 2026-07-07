using FluentAssertions;
using MessengerApp.Application.Messages.Commands.ToggleReaction;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Xunit;

namespace MessengerApp.Application.UnitTests.Messages;

public class ToggleReactionCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly ToggleReactionCommandHandler _handler;

    public ToggleReactionCommandHandlerTests()
    {
        _handler = new ToggleReactionCommandHandler(_context);
    }

    [Fact]
    public async Task Handle_WhenMessageNotFound_ReturnsNotFound()
    {
        ToggleReactionCommand cmd = new(Guid.NewGuid(), Guid.NewGuid(), "👍");

        Result<ToggleReactionResponse> result = await _handler.Handle(cmd, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.NotFound);
        result.Error.Code.Should().Be("Message.NotFound");
    }

    [Fact]
    public async Task Handle_WhenUserNotMemberOfChannel_ReturnsForbidden()
    {
        User author = User.Create("author@example.com", "author", "hash");
        User outsider = User.Create("outsider@example.com", "outsider", "hash");
        Channel channel = Channel.CreateGroup("general", author.Id);
        _context.Users.AddRange(author, outsider);
        _context.Channels.Add(channel);

        Message message = Message.Create(channel.Id, author.Id, "Hello world");
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        ToggleReactionCommand cmd = new(outsider.Id, message.Id, "👍");

        Result<ToggleReactionResponse> result = await _handler.Handle(cmd, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
        result.Error.Code.Should().Be("Channel.NotMember");
    }

    [Fact]
    public async Task Handle_WhenReactionDoesNotExist_AddsReactionAndReturnsAggregatedGroup()
    {
        User user = User.Create("user@example.com", "user", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        Message message = Message.Create(channel.Id, user.Id, "Hello world");
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        ToggleReactionCommand cmd = new(user.Id, message.Id, "👍");

        Result<ToggleReactionResponse> result = await _handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.MessageId.Should().Be(message.Id);
        result.Value.ChannelId.Should().Be(channel.Id);
        result.Value.Reactions.Should().HaveCount(1);
        result.Value.Reactions[0].Emoji.Should().Be("👍");
        result.Value.Reactions[0].Count.Should().Be(1);
        result.Value.Reactions[0].UserIds.Should().Contain(user.Id);
    }

    [Fact]
    public async Task Handle_WhenReactionAlreadyExists_RemovesReactionAndReturnsEmpty()
    {
        User user = User.Create("user@example.com", "user", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        Message message = Message.Create(channel.Id, user.Id, "Hello world");
        message.ToggleReaction(user.Id, "❤️");
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        ToggleReactionCommand cmd = new(user.Id, message.Id, "❤️");

        Result<ToggleReactionResponse> result = await _handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Reactions.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WhenMultipleUsersReact_AggregatesCountsAccurately()
    {
        User user1 = User.Create("user1@example.com", "user1", "hash");
        User user2 = User.Create("user2@example.com", "user2", "hash");
        Channel channel = Channel.CreateGroup("general", user1.Id);
        channel.AddMember(user2.Id);
        _context.Users.AddRange(user1, user2);
        _context.Channels.Add(channel);

        Message message = Message.Create(channel.Id, user1.Id, "Multiple reactions");
        message.ToggleReaction(user1.Id, "🔥");
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // user2 also reacts with "🔥"
        ToggleReactionCommand cmd = new(user2.Id, message.Id, "🔥");
        Result<ToggleReactionResponse> result = await _handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Reactions.Should().HaveCount(1);
        result.Value.Reactions[0].Emoji.Should().Be("🔥");
        result.Value.Reactions[0].Count.Should().Be(2);
        result.Value.Reactions[0].UserIds.Should().Contain([user1.Id, user2.Id]);
    }
}
