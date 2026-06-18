using FluentAssertions;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Channels.Queries.GetChannelById;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class GetChannelByIdQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenUserIsMember_ShouldReturnChannelDetails()
    {
        Guid aliceId = Guid.NewGuid();
        Guid bobId = Guid.NewGuid();

        User alice = User.Create("alice@example.com", "alice", "pwd");
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(alice, aliceId);

        User bob = User.Create("bob@example.com", "bob", "pwd");
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(bob, bobId);

        _context.Users.AddRange(alice, bob);

        Channel channel = Channel.CreateGroup("Development", aliceId, "Dev discussion");
        channel.AddMember(bobId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        GetChannelByIdQueryHandler handler = new(_context);
        GetChannelByIdQuery query = new(channel.Id, aliceId);

        Result<ChannelDetailDto> result = await handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Id.Should().Be(channel.Id);
        result.Value.Name.Should().Be("Development");
        result.Value.Description.Should().Be("Dev discussion");
        result.Value.MemberCount.Should().Be(2);
        result.Value.CreatorId.Should().Be(aliceId);
    }

    [Fact]
    public async Task Handle_WhenUserIsNotMember_ShouldReturnForbidden()
    {
        Guid aliceId = Guid.NewGuid();
        Guid strangerId = Guid.NewGuid();

        User alice = User.Create("alice@example.com", "alice", "pwd");
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(alice, aliceId);
        _context.Users.Add(alice);

        Channel channel = Channel.CreateGroup("Private Group", aliceId);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        GetChannelByIdQueryHandler handler = new(_context);
        GetChannelByIdQuery query = new(channel.Id, strangerId);

        Result<ChannelDetailDto> result = await handler.Handle(query, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Channel.AccessDenied");
    }

    [Fact]
    public async Task Handle_WhenChannelDoesNotExistOrIsDeleted_ShouldReturnNotFound()
    {
        Guid aliceId = Guid.NewGuid();
        Channel deletedChannel = Channel.CreateGroup("Old Group", aliceId);
        deletedChannel.IsDeleted = true;
        _context.Channels.Add(deletedChannel);
        await _context.SaveChangesAsync();

        GetChannelByIdQueryHandler handler = new(_context);
        GetChannelByIdQuery query = new(deletedChannel.Id, aliceId);

        Result<ChannelDetailDto> result = await handler.Handle(query, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Channel.NotFound");
    }
}
