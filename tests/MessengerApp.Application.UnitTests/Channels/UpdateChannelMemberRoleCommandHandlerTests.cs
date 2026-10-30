using FluentAssertions;
using MessengerApp.Application.Channels.Commands.UpdateChannelMemberRole;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class UpdateChannelMemberRoleCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenOwnerPromotesMemberToAdmin_ShouldSucceed()
    {
        Guid ownerId = Guid.NewGuid();
        Guid memberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(memberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        UpdateChannelMemberRoleCommandHandler handler = new(_context);
        UpdateChannelMemberRoleCommand command = new(channel.Id, ownerId, memberId, ChannelMemberRole.Admin);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        ChannelMember updatedMember = _context.ChannelMembers.First(m => m.ChannelId == channel.Id && m.UserId == memberId);
        updatedMember.Role.Should().Be(ChannelMemberRole.Admin);
    }

    [Fact]
    public async Task Handle_WhenOwnerDemotesAdminToMember_ShouldSucceed()
    {
        Guid ownerId = Guid.NewGuid();
        Guid adminId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(adminId, ChannelMemberRole.Admin);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        UpdateChannelMemberRoleCommandHandler handler = new(_context);
        UpdateChannelMemberRoleCommand command = new(channel.Id, ownerId, adminId, ChannelMemberRole.Member);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        ChannelMember updatedMember = _context.ChannelMembers.First(m => m.ChannelId == channel.Id && m.UserId == adminId);
        updatedMember.Role.Should().Be(ChannelMemberRole.Member);
    }

    [Fact]
    public async Task Handle_WhenNonOwnerAttemptsToChangeRole_ShouldReturnForbidden()
    {
        Guid ownerId = Guid.NewGuid();
        Guid adminId = Guid.NewGuid();
        Guid memberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(adminId, ChannelMemberRole.Admin);
        channel.AddMember(memberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        UpdateChannelMemberRoleCommandHandler handler = new(_context);
        UpdateChannelMemberRoleCommand command = new(channel.Id, adminId, memberId, ChannelMemberRole.Admin);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
    }

    [Fact]
    public async Task Handle_WhenAttemptingToModifyOwnerRole_ShouldReturnForbidden()
    {
        Guid ownerId = Guid.NewGuid();
        Guid adminId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(adminId, ChannelMemberRole.Admin);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        UpdateChannelMemberRoleCommandHandler handler = new(_context);
        UpdateChannelMemberRoleCommand command = new(channel.Id, ownerId, ownerId, ChannelMemberRole.Member);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
    }

    [Fact]
    public async Task Handle_WhenTargetIsNotMember_ShouldReturnNotFound()
    {
        Guid ownerId = Guid.NewGuid();
        Guid nonMemberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        UpdateChannelMemberRoleCommandHandler handler = new(_context);
        UpdateChannelMemberRoleCommand command = new(channel.Id, ownerId, nonMemberId, ChannelMemberRole.Admin);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task Handle_WhenChannelIsDirect_ShouldReturnValidationFailure()
    {
        Guid userAId = Guid.NewGuid();
        Guid userBId = Guid.NewGuid();

        Channel channel = Channel.CreateDirect(userAId, userBId);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        UpdateChannelMemberRoleCommandHandler handler = new(_context);
        UpdateChannelMemberRoleCommand command = new(channel.Id, userAId, userBId, ChannelMemberRole.Admin);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Validation);
    }
}
