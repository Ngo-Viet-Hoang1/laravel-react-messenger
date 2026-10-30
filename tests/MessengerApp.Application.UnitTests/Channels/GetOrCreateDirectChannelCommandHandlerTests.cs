using FluentAssertions;
using MessengerApp.Application.Channels.Commands.GetOrCreateDirectChannel;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class GetOrCreateDirectChannelCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly GetOrCreateDirectChannelCommandHandler _handler;

    public GetOrCreateDirectChannelCommandHandlerTests()
    {
        _handler = new GetOrCreateDirectChannelCommandHandler(_context);
    }

    [Fact]
    public async Task Handle_WhenDirectChannelDoesNotExist_ShouldCreateNewDirectChannel()
    {
        User alice = User.Create("alice@example.com", "alice", "pwd", "https://avatar/alice.png");
        User bob = User.Create("bob@example.com", "bob", "pwd", "https://avatar/bob.png");
        _context.Users.AddRange(alice, bob);
        await _context.SaveChangesAsync();

        GetOrCreateDirectChannelCommand command = new(alice.Id, bob.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Type.Should().Be(ChannelType.Direct);
        result.Value.IsSecret.Should().BeFalse();
        result.Value.EncryptionSalt.Should().BeNull();
        // From Alice's perspective, the direct channel name should be Bob
        result.Value.Name.Should().Be("bob");
        result.Value.AvatarUrl.Should().Be("https://avatar/bob.png");
        result.Value.MemberCount.Should().Be(2);

        Channel? directInDb = _context.Channels.FirstOrDefault(c => c.Type == ChannelType.Direct);
        directInDb.Should().NotBeNull();
        directInDb!.Members.Count.Should().Be(2);
    }

    [Fact]
    public async Task Handle_WhenDirectChannelAlreadyExists_ShouldReturnExistingChannelWithoutDuplication()
    {
        User alice = User.Create("alice@example.com", "alice", "pwd");
        User bob = User.Create("bob@example.com", "bob", "pwd");
        _context.Users.AddRange(alice, bob);

        Channel existingChannel = Channel.CreateDirect(alice.Id, bob.Id);
        _context.Channels.Add(existingChannel);
        await _context.SaveChangesAsync();

        GetOrCreateDirectChannelCommand command = new(alice.Id, bob.Id);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Id.Should().Be(existingChannel.Id);

        // Ensure database still has only 1 direct channel
        _context.Channels.Count(c => c.Type == ChannelType.Direct).Should().Be(1);
    }

    [Fact]
    public async Task Handle_WhenSecretChannelRequested_ShouldCreateSecretChannelWithSalt()
    {
        User alice = User.Create("alice@example.com", "alice", "pwd");
        User bob = User.Create("bob@example.com", "bob", "pwd");
        _context.Users.AddRange(alice, bob);
        await _context.SaveChangesAsync();

        GetOrCreateDirectChannelCommand command = new(alice.Id, bob.Id, IsSecret: true);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.IsSecret.Should().BeTrue();
        result.Value.EncryptionSalt.Should().NotBeNullOrWhiteSpace();
        result.Value.EncryptionSalt!.Length.Should().Be(32); // 16 bytes in hex

        Channel? secretInDb = _context.Channels.FirstOrDefault(c => c.IsSecret);
        secretInDb.Should().NotBeNull();
        secretInDb!.EncryptionSalt.Should().Be(result.Value.EncryptionSalt);
    }

    [Fact]
    public async Task Handle_WhenSecretAndRegularChannelsCoexist_ShouldSeparateThem()
    {
        User alice = User.Create("alice@example.com", "alice", "pwd");
        User bob = User.Create("bob@example.com", "bob", "pwd");
        _context.Users.AddRange(alice, bob);
        await _context.SaveChangesAsync();

        // 1. Create regular direct channel
        var regResult = await _handler.Handle(new GetOrCreateDirectChannelCommand(alice.Id, bob.Id, IsSecret: false), CancellationToken.None);
        regResult.IsSuccess.Should().BeTrue();
        regResult.Value.IsSecret.Should().BeFalse();

        // 2. Create secret direct channel
        var secResult = await _handler.Handle(new GetOrCreateDirectChannelCommand(alice.Id, bob.Id, IsSecret: true), CancellationToken.None);
        secResult.IsSuccess.Should().BeTrue();
        secResult.Value.IsSecret.Should().BeTrue();

        // Must be two distinct channels
        regResult.Value.Id.Should().NotBe(secResult.Value.Id);
        _context.Channels.Count(c => c.Type == ChannelType.Direct).Should().Be(2);

        // 3. Request secret channel again -> should return existing secret channel, not create another
        var secAgainResult = await _handler.Handle(new GetOrCreateDirectChannelCommand(alice.Id, bob.Id, IsSecret: true), CancellationToken.None);
        secAgainResult.IsSuccess.Should().BeTrue();
        secAgainResult.Value.Id.Should().Be(secResult.Value.Id);
        _context.Channels.Count(c => c.Type == ChannelType.Direct).Should().Be(2);
    }

    [Fact]
    public async Task Handle_WhenTargetUserNotFound_ShouldReturnNotFound()
    {
        User alice = User.Create("alice@example.com", "alice", "pwd");
        _context.Users.Add(alice);
        await _context.SaveChangesAsync();

        Guid nonExistentUserId = Guid.NewGuid();
        GetOrCreateDirectChannelCommand command = new(alice.Id, nonExistentUserId);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("User.NotFound");
    }
}
