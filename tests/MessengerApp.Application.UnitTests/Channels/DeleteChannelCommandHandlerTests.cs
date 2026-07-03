using FluentAssertions;
using MessengerApp.Application.Channels.Commands.DeleteChannel;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class DeleteChannelCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenOwnerDeletesChannel_ShouldSoftDelete()
    {
        Guid ownerId = Guid.NewGuid();
        Channel channel = Channel.CreateGroup("Obsolete", ownerId);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        DeleteChannelCommandHandler handler = new(_context);
        DeleteChannelCommand command = new(channel.Id, ownerId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        Channel deleted = _context.Channels.First(c => c.Id == channel.Id);
        deleted.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenNonOwnerAttemptsDelete_ShouldReturnForbidden()
    {
        Guid ownerId = Guid.NewGuid();
        Guid adminId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Protected", ownerId);
        channel.AddMember(adminId, ChannelMemberRole.Admin);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        DeleteChannelCommandHandler handler = new(_context);
        DeleteChannelCommand command = new(channel.Id, adminId);

        Result result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
        result.Error.Code.Should().Be("Channel.OnlyOwnerCanDelete");
    }
}
