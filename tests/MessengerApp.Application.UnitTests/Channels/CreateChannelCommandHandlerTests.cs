using FluentAssertions;
using MessengerApp.Application.Channels.Commands.CreateChannel;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class CreateChannelCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly CreateChannelCommandHandler _handler;

    public CreateChannelCommandHandlerTests()
    {
        _handler = new CreateChannelCommandHandler(_context);
    }

    [Fact]
    public async Task Handle_WithValidCommand_ShouldCreateGroupChannelWithCreatorAsOwner()
    {
        var creator = User.Create("alice@example.com", "alice", "hashed_pwd");
        _context.Users.Add(creator);
        await _context.SaveChangesAsync();

        var command = new CreateChannelCommand(creator.Id, "general", "General discussion");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Name.Should().Be("general");
        result.Value.Type.Should().Be(ChannelType.Group);
        result.Value.Description.Should().Be("General discussion");
        result.Value.MemberCount.Should().Be(1);

        var channelInDb = _context.Channels.FirstOrDefault(c => c.Name == "general");
        channelInDb.Should().NotBeNull();
        channelInDb!.Members.Should().ContainSingle(m => m.UserId == creator.Id && m.Role == ChannelMemberRole.Owner);
    }

    [Fact]
    public async Task Handle_WithDuplicateGroupName_ShouldReturnConflict()
    {
        var existingChannel = Channel.CreateGroup("general", Guid.NewGuid());
        _context.Channels.Add(existingChannel);
        await _context.SaveChangesAsync();

        var command = new CreateChannelCommand(Guid.NewGuid(), "general");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Channel.NameConflict");
    }

    [Fact]
    public async Task Handle_WithInitialMembers_ShouldAddAllValidMembers()
    {
        var creator = User.Create("alice@example.com", "alice", "hashed_pwd");
        var bob = User.Create("bob@example.com", "bob", "hashed_pwd");
        var charlie = User.Create("charlie@example.com", "charlie", "hashed_pwd");
        _context.Users.AddRange(creator, bob, charlie);
        await _context.SaveChangesAsync();

        var command = new CreateChannelCommand(
            creator.Id,
            "project-x",
            "Top secret",
            null,
            [bob.Id, charlie.Id, creator.Id]); // Includes duplicate creator ID to test dedup

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.MemberCount.Should().Be(3);

        var channelInDb = _context.Channels.FirstOrDefault(c => c.Name == "project-x");
        channelInDb.Should().NotBeNull();
        channelInDb!.Members.Count.Should().Be(3);
    }

    [Fact]
    public async Task Handle_WithIsSecretTrue_ShouldCreateSecretChannelWithEncryptionSalt()
    {
        var creator = User.Create("alice@example.com", "alice", "hashed_pwd");
        _context.Users.Add(creator);
        await _context.SaveChangesAsync();

        var command = new CreateChannelCommand(creator.Id, "secret-ops", "Top secret team", null, null, IsSecret: true);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Name.Should().Be("secret-ops");
        result.Value.Type.Should().Be(ChannelType.Group);
        result.Value.IsSecret.Should().BeTrue();
        result.Value.EncryptionSalt.Should().NotBeNullOrWhiteSpace();

        var channelInDb = _context.Channels.FirstOrDefault(c => c.Name == "secret-ops");
        channelInDb.Should().NotBeNull();
        channelInDb!.IsSecret.Should().BeTrue();
        channelInDb.EncryptionSalt.Should().NotBeNullOrWhiteSpace();
        channelInDb.Members.Should().ContainSingle(m => m.UserId == creator.Id && m.Role == ChannelMemberRole.Owner);
    }
}
