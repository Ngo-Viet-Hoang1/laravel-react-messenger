using FluentAssertions;
using MessengerApp.Application.Channels.Commands.LeaveChannel;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class LeaveChannelCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenRegularMemberLeaves_ShouldRemoveFromChannel()
    {
        Guid ownerId = Guid.NewGuid();
        Guid memberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(memberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        LeaveChannelCommandHandler handler = new(_context);
        LeaveChannelCommand command = new(channel.Id, memberId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        _context.ChannelMembers.Any(m => m.ChannelId == channel.Id && m.UserId == memberId).Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenOwnerLeavesWithOtherMembersPresent_ShouldReturnValidationFailure()
    {
        Guid ownerId = Guid.NewGuid();
        Guid memberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(memberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        LeaveChannelCommandHandler handler = new(_context);
        LeaveChannelCommand command = new(channel.Id, ownerId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Validation);
        result.Error.Code.Should().Be("Channel.OwnerCannotLeave");
    }

    [Fact]
    public async Task Handle_WhenOwnerLeavesAsSoleMember_ShouldSoftDeleteChannel()
    {
        Guid ownerId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Solo Group", ownerId);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        LeaveChannelCommandHandler handler = new(_context);
        LeaveChannelCommand command = new(channel.Id, ownerId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        Channel deleted = _context.Channels.First(c => c.Id == channel.Id);
        deleted.IsDeleted.Should().BeTrue();
    }
}
