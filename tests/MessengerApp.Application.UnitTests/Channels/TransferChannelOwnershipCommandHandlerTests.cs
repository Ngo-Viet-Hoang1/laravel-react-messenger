using FluentAssertions;
using MessengerApp.Application.Channels.Commands.TransferChannelOwnership;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class TransferChannelOwnershipCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenOwnerTransfersOwnership_ShouldSucceed()
    {
        Guid ownerId = Guid.NewGuid();
        Guid targetMemberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Product Engineering", ownerId);
        channel.AddMember(targetMemberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        TransferChannelOwnershipCommandHandler handler = new(_context);
        TransferChannelOwnershipCommand command = new(channel.Id, ownerId, targetMemberId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();

        ChannelMember oldOwner = _context.ChannelMembers.First(m => m.ChannelId == channel.Id && m.UserId == ownerId);
        ChannelMember newOwner = _context.ChannelMembers.First(m => m.ChannelId == channel.Id && m.UserId == targetMemberId);

        oldOwner.Role.Should().Be(ChannelMemberRole.Admin);
        newOwner.Role.Should().Be(ChannelMemberRole.Owner);
    }

    [Fact]
    public async Task Handle_WhenNonOwnerAttemptsTransfer_ShouldReturnForbidden()
    {
        Guid ownerId = Guid.NewGuid();
        Guid adminId = Guid.NewGuid();
        Guid memberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Product Engineering", ownerId);
        channel.AddMember(adminId, ChannelMemberRole.Admin);
        channel.AddMember(memberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        TransferChannelOwnershipCommandHandler handler = new(_context);
        TransferChannelOwnershipCommand command = new(channel.Id, adminId, memberId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
    }

    [Fact]
    public async Task Handle_WhenTargetIsNotMember_ShouldReturnNotFound()
    {
        Guid ownerId = Guid.NewGuid();
        Guid outsiderId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Product Engineering", ownerId);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        TransferChannelOwnershipCommandHandler handler = new(_context);
        TransferChannelOwnershipCommand command = new(channel.Id, ownerId, outsiderId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task Handle_WhenChannelIsDirect_ShouldReturnValidationFailure()
    {
        Guid userA = Guid.NewGuid();
        Guid userB = Guid.NewGuid();

        Channel channel = Channel.CreateDirect(userA, userB);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        TransferChannelOwnershipCommandHandler handler = new(_context);
        TransferChannelOwnershipCommand command = new(channel.Id, userA, userB);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Validation);
    }
}
