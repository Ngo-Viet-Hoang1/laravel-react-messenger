using FluentAssertions;
using MessengerApp.Application.Channels.Commands.RemoveChannelMember;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class RemoveChannelMemberCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenOwnerRemovesMember_ShouldSucceed()
    {
        Guid ownerId = Guid.NewGuid();
        Guid memberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(memberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        RemoveChannelMemberCommandHandler handler = new(_context);
        RemoveChannelMemberCommand command = new(channel.Id, ownerId, memberId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _context.ChannelMembers.Any(m => m.ChannelId == channel.Id && m.UserId == memberId).Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenAttemptingToRemoveOwner_ShouldReturnForbidden()
    {
        Guid ownerId = Guid.NewGuid();
        Guid adminId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(adminId, ChannelMemberRole.Admin);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        RemoveChannelMemberCommandHandler handler = new(_context);
        RemoveChannelMemberCommand command = new(channel.Id, adminId, ownerId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
    }
}
