using FluentAssertions;
using MessengerApp.Application.Channels.Commands.UpdateChannel;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class UpdateChannelCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenCallerIsOwnerOrAdmin_ShouldUpdateDetails()
    {
        Guid ownerId = Guid.NewGuid();
        Channel channel = Channel.CreateGroup("Old Name", ownerId, "Old Desc");
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        UpdateChannelCommandHandler handler = new(_context);
        UpdateChannelCommand command = new(channel.Id, ownerId, "New Name", "New Desc", "http://avatar.jpg");

        Result<ChannelDetailDto> result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Name.Should().Be("New Name");
        result.Value.Description.Should().Be("New Desc");
        result.Value.AvatarUrl.Should().Be("http://avatar.jpg");
    }

    [Fact]
    public async Task Handle_WhenCallerIsRegularMember_ShouldReturnForbidden()
    {
        Guid ownerId = Guid.NewGuid();
        Guid memberId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Team", ownerId);
        channel.AddMember(memberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        UpdateChannelCommandHandler handler = new(_context);
        UpdateChannelCommand command = new(channel.Id, memberId, "Hacked", null, null);

        Result<ChannelDetailDto> result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
    }
}
