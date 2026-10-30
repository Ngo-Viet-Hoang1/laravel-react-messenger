using FluentAssertions;
using MessengerApp.Application.Attachments.Commands.AbortUpload;
using MessengerApp.Application.Attachments.Commands.CompleteUpload;
using MessengerApp.Application.Attachments.Commands.CreatePresignedUpload;
using MessengerApp.Application.Attachments.Common;
using MessengerApp.Application.Attachments.Queries.GetAttachmentStreamUrl;
using MessengerApp.Application.Attachments.Queries.GetUploadedParts;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Attachments;

public class AttachmentCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IObjectStorageService _storage = Substitute.For<IObjectStorageService>();

    [Fact]
    public async Task CreatePresignedUpload_WhenUserNotMember_ReturnsForbidden()
    {
        var channel = Channel.CreateGroup("test-channel", Guid.NewGuid());
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        var handler = new CreatePresignedUploadCommandHandler(_context, _storage);
        var cmd = new CreatePresignedUploadCommand(
            channel.Id,
            Guid.NewGuid(),
            "photo.jpg",
            "image/jpeg",
            1024 * 50);

        var result = await handler.Handle(cmd, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
    }

    [Fact]
    public async Task CreatePresignedUpload_SinglePut_CreatesAttachmentAndReturnsPresignedUrl()
    {
        var user = User.Create("user@example.com", "user", "hash");
        var channel = Channel.CreateGroup("test-channel", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        _storage.GeneratePresignedUploadUrl(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<TimeSpan>())
            .Returns("http://localhost:9000/presigned-put-url");

        var handler = new CreatePresignedUploadCommandHandler(_context, _storage);
        var cmd = new CreatePresignedUploadCommand(
            channel.Id,
            user.Id,
            "photo.jpg",
            "image/jpeg",
            1024 * 50); // 50 KB (less than 10MB threshold)

        var result = await handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.IsMultipart.Should().BeFalse();
        result.Value.UploadUrl.Should().Be("http://localhost:9000/presigned-put-url");
        result.Value.UploadId.Should().BeNull();

        var created = await _context.MessageAttachments.FindAsync(result.Value.AttachmentId);
        created.Should().NotBeNull();
        created!.IsUploadCompleted.Should().BeFalse();
    }

    [Fact]
    public async Task CompleteUpload_MarksAttachmentCompleted()
    {
        var user = User.Create("user@example.com", "user", "hash");
        var channel = Channel.CreateGroup("test-channel", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        var attachment = MessageAttachment.Create(
            channel.Id,
            "doc.pdf",
            "channels/doc.pdf",
            "application/pdf",
            2048);
        _context.MessageAttachments.Add(attachment);
        await _context.SaveChangesAsync();

        _storage.GeneratePresignedReadUrl(Arg.Any<string>(), Arg.Any<TimeSpan>(), Arg.Any<string>())
            .Returns("http://localhost:9000/stream-read-url");

        var handler = new CompleteUploadCommandHandler(_context, _storage);
        var cmd = new CompleteUploadCommand(channel.Id, attachment.Id, user.Id);

        var result = await handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Url.Should().Be("http://localhost:9000/stream-read-url");

        var updated = await _context.MessageAttachments.FindAsync(attachment.Id);
        updated!.IsUploadCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task AbortUpload_DeletesObjectAndRemovesRecord()
    {
        var user = User.Create("user@example.com", "user", "hash");
        var channel = Channel.CreateGroup("test-channel", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        var attachment = MessageAttachment.Create(
            channel.Id,
            "canceled.mp4",
            "channels/canceled.mp4",
            "video/mp4",
            1024 * 1024 * 20,
            s3UploadId: "test-upload-id");
        _context.MessageAttachments.Add(attachment);
        await _context.SaveChangesAsync();

        var handler = new AbortUploadCommandHandler(_context, _storage);
        var cmd = new AbortUploadCommand(channel.Id, attachment.Id, user.Id);

        var result = await handler.Handle(cmd, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await _storage.Received(1).AbortMultipartUploadAsync("channels/canceled.mp4", "test-upload-id", Arg.Any<CancellationToken>());

        var deleted = await _context.MessageAttachments.FindAsync(attachment.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task GetAttachmentStreamUrl_ReturnsValidPresignedUrl()
    {
        var user = User.Create("user@example.com", "user", "hash");
        var channel = Channel.CreateGroup("test-channel", user.Id);
        _context.Users.Add(user);
        _context.Channels.Add(channel);

        var attachment = MessageAttachment.Create(
            channel.Id,
            "video.mp4",
            "channels/video.mp4",
            "video/mp4",
            1024 * 1024 * 50);
        attachment.MarkCompleted();
        _context.MessageAttachments.Add(attachment);
        await _context.SaveChangesAsync();

        _storage.GeneratePresignedReadUrl("channels/video.mp4", Arg.Any<TimeSpan>(), Arg.Any<string?>())
            .Returns("http://localhost:9000/messenger-media/channels/video.mp4?sig=123");

        var handler = new GetAttachmentStreamUrlQueryHandler(_context, _storage);
        var query = new GetAttachmentStreamUrlQuery(channel.Id, attachment.Id, user.Id);

        var result = await handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.StreamUrl.Should().Be("http://localhost:9000/messenger-media/channels/video.mp4?sig=123");
    }
}
