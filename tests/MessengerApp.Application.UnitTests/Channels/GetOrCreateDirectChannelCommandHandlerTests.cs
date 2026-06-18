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
