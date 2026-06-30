using FluentAssertions;
using MessengerApp.Application.Messages.Commands.SendMessage;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Messages;

public class SendMessageCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly SendMessageCommandHandler _handler;

    public SendMessageCommandHandlerTests()
    {
        _handler = new SendMessageCommandHandler(_context);
    }

    [Fact]
    public async Task Handle_WhenSenderNotMemberOfChannel_ReturnsForbidden()
    {
        User sender = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", Guid.NewGuid());
        _context.Users.Add(sender);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        SendMessageCommand command = new(sender.Id, channel.Id, "Hello World");

        Result<MessageDto> result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
        result.Error.Code.Should().Be("Channel.NotMember");
    }

    [Fact]
    public async Task Handle_WhenValidCommand_CreatesMessageAndReturnsSuccess()
    {
        User sender = User.Create("alice@example.com", "alice", "hash");
        Channel channel = Channel.CreateGroup("general", sender.Id);
        _context.Users.Add(sender);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        string clientMsgId = Guid.NewGuid().ToString();
        SendMessageCommand command = new(sender.Id, channel.Id, "Hello team!", clientMsgId);

        Result<MessageDto> result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Content.Should().Be("Hello team!");
        result.Value.ChannelId.Should().Be(channel.Id);
        result.Value.SenderId.Should().Be(sender.Id);
        result.Value.SenderUsername.Should().Be("alice");
        result.Value.ClientMessageId.Should().Be(clientMsgId);

        Message? savedMessage = _context.Messages.FirstOrDefault(m => m.Id == result.Value.Id);
        savedMessage.Should().NotBeNull();
        savedMessage!.Content.Should().Be("Hello team!");
    }

    [Fact]
    public async Task Handle_WhenClientMessageIdAlreadyExists_ReturnsExistingMessageWithoutDuplicates()
    {
        User sender = User.Create("bob@example.com", "bob", "hash");
        Channel channel = Channel.CreateGroup("dev", sender.Id);
        _context.Users.Add(sender);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        string idempotencyKey = "uuid-client-12345";
        SendMessageCommand firstCommand = new(sender.Id, channel.Id, "Same message content", idempotencyKey);
        Result<MessageDto> firstResult = await _handler.Handle(firstCommand, CancellationToken.None);

        SendMessageCommand duplicateCommand = new(sender.Id, channel.Id, "Same message content", idempotencyKey);
        Result<MessageDto> duplicateResult = await _handler.Handle(duplicateCommand, CancellationToken.None);

        duplicateResult.IsSuccess.Should().BeTrue();
        duplicateResult.Value.Id.Should().Be(firstResult.Value.Id);

        int totalMessages = _context.Messages.Count(m => m.ChannelId == channel.Id);
        totalMessages.Should().Be(1);
    }
}
