using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Messages.Commands.SendMessage;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Messages;

public class SendMessageCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IObjectStorageService _storage = Substitute.For<IObjectStorageService>();
    private readonly SendMessageCommandHandler _handler;

    public SendMessageCommandHandlerTests()
    {
        _handler = new SendMessageCommandHandler(_context, _storage);
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

    [Fact]
    public async Task Handle_WhenReplyingToValidMessage_ReturnsSuccessWithReplyTo()
    {
        User author = User.Create("carol@example.com", "carol", "hash");
        User replier = User.Create("dave@example.com", "dave", "hash");
        Channel channel = Channel.CreateGroup("chat", author.Id);
        channel.AddMember(replier.Id);
        _context.Users.AddRange(author, replier);
        _context.Channels.Add(channel);

        Message parentMessage = Message.Create(channel.Id, author.Id, "Original question");
        _context.Messages.Add(parentMessage);
        await _context.SaveChangesAsync();

        SendMessageCommand replyCommand = new(replier.Id, channel.Id, "Here is my answer", null, parentMessage.Id);
        Result<MessageDto> replyResult = await _handler.Handle(replyCommand, CancellationToken.None);

        replyResult.IsSuccess.Should().BeTrue();
        replyResult.Value.ReplyTo.Should().NotBeNull();
        replyResult.Value.ReplyTo!.Id.Should().Be(parentMessage.Id);
        replyResult.Value.ReplyTo!.SenderId.Should().Be(author.Id);
        replyResult.Value.ReplyTo!.SenderUsername.Should().Be("carol");
        replyResult.Value.ReplyTo!.Content.Should().Be("Original question");
    }

    [Fact]
    public async Task Handle_WhenReplyingToMessageInDifferentChannel_ReturnsForbidden()
    {
        User user = User.Create("eve@example.com", "eve", "hash");
        Channel channelA = Channel.CreateGroup("channel-a", user.Id);
        Channel channelB = Channel.CreateGroup("channel-b", user.Id);
        _context.Users.Add(user);
        _context.Channels.AddRange(channelA, channelB);

        Message messageInChannelA = Message.Create(channelA.Id, user.Id, "Secret in Channel A");
        _context.Messages.Add(messageInChannelA);
        await _context.SaveChangesAsync();

        // Attempt to reply in Channel B using message from Channel A
        SendMessageCommand maliciousReply = new(user.Id, channelB.Id, "Leaking secret", null, messageInChannelA.Id);
        Result<MessageDto> result = await _handler.Handle(maliciousReply, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
        result.Error.Code.Should().Be("Message.CrossChannelReplyForbidden");
    }

    [Fact]
    public async Task Handle_WhenReplyingToNonExistentMessage_ReturnsNotFound()
    {
        User user = User.Create("frank@example.com", "frank", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        SendMessageCommand invalidReply = new(user.Id, channel.Id, "Reply to ghost", null, Guid.NewGuid());
        Result<MessageDto> result = await _handler.Handle(invalidReply, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.NotFound);
        result.Error.Code.Should().Be("Message.ParentNotFound");
    }

    [Fact]
    public async Task Handle_WhenMessageHasOnlyAttachmentsAndNoContent_CreatesMessageSuccessfully()
    {
        User user = User.Create("george@example.com", "george", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        var attachment = MessageAttachment.Create(
            channel.Id,
            "photo.png",
            "channels/photo.png",
            "image/png",
            1024);
        attachment.MarkCompleted();
        _context.MessageAttachments.Add(attachment);
        await _context.SaveChangesAsync();

        _storage.GeneratePresignedReadUrl(Arg.Any<string>(), Arg.Any<TimeSpan>(), Arg.Any<string>())
            .Returns("http://localhost:9000/photo.png");

        SendMessageCommand command = new(
            user.Id,
            channel.Id,
            Content: null,
            AttachmentIds: [attachment.Id]);

        Result<MessageDto> result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Content.Should().BeEmpty();
        result.Value.Attachments.Should().NotBeNull();
        result.Value.Attachments.Should().HaveCount(1);
        result.Value.Attachments![0].FileName.Should().Be("photo.png");
    }

    [Fact]
    public async Task Handle_WhenAttachmentNotCompleted_ReturnsValidationError()
    {
        User user = User.Create("helen@example.com", "helen", "hash");
        Channel channel = Channel.CreateGroup("general", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        var incompleteAttachment = MessageAttachment.Create(
            channel.Id,
            "unfinished.mp4",
            "channels/unfinished.mp4",
            "video/mp4",
            1024 * 1024 * 5);
        // IsUploadCompleted is false
        _context.MessageAttachments.Add(incompleteAttachment);
        await _context.SaveChangesAsync();

        SendMessageCommand command = new(
            user.Id,
            channel.Id,
            Content: "Video is here",
            AttachmentIds: [incompleteAttachment.Id]);

        Result<MessageDto> result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Validation);
        result.Error.Code.Should().Be("Message.InvalidAttachments");
    }

    [Fact]
    public async Task Handle_WhenAttachmentBelongsToDifferentChannel_ReturnsValidationError()
    {
        User user = User.Create("ian@example.com", "ian", "hash");
        Channel channel1 = Channel.CreateGroup("chan1", user.Id);
        Channel channel2 = Channel.CreateGroup("chan2", user.Id);
        _context.Users.Add(user);
        _context.Channels.AddRange(channel1, channel2);

        var attachmentInChan1 = MessageAttachment.Create(
            channel1.Id,
            "secret.pdf",
            "channels/secret.pdf",
            "application/pdf",
            2048);
        attachmentInChan1.MarkCompleted();
        _context.MessageAttachments.Add(attachmentInChan1);
        await _context.SaveChangesAsync();

        // Try to attach channel 1's attachment into channel 2
        SendMessageCommand command = new(
            user.Id,
            channel2.Id,
            Content: "Check this doc",
            AttachmentIds: [attachmentInChan1.Id]);

        Result<MessageDto> result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Validation);
        result.Error.Code.Should().Be("Message.InvalidAttachments");
    }

    [Fact]
    public void Validator_WhenNeitherContentNorAttachmentsProvided_FailsValidation()
    {
        var validator = new SendMessageCommandValidator();
        var command = new SendMessageCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Content: "",
            AttachmentIds: null);

        var validationResult = validator.Validate(command);

        validationResult.IsValid.Should().BeFalse();
        validationResult.Errors.Should().Contain(e => e.PropertyName == "Content");
    }

    [Fact]
    public void Validator_WhenContentEmptyButAttachmentsProvided_PassesValidation()
    {
        var validator = new SendMessageCommandValidator();
        var command = new SendMessageCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Content: "",
            AttachmentIds: [Guid.NewGuid()]);

        var validationResult = validator.Validate(command);

        validationResult.Errors.Should().NotContain(e => e.PropertyName == "Content");
    }
}
