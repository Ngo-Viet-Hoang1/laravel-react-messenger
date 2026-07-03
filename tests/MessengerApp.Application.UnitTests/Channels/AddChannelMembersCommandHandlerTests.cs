using FluentAssertions;
using MessengerApp.Application.Channels.Commands.AddChannelMembers;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class AddChannelMembersCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenValid_ShouldAddMembersAndReturnCount()
    {
        Guid ownerId = Guid.NewGuid();
        Guid newUserId1 = Guid.NewGuid();
        Guid newUserId2 = Guid.NewGuid();

        User owner = User.Create("owner@example.com", "owner", "pwd");
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(owner, ownerId);

        User user1 = User.Create("u1@example.com", "u1", "pwd");
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(user1, newUserId1);

        User user2 = User.Create("u2@example.com", "u2", "pwd");
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(user2, newUserId2);

        _context.Users.AddRange(owner, user1, user2);

        Channel channel = Channel.CreateGroup("Team", ownerId);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        AddChannelMembersCommandHandler handler = new(_context);
        AddChannelMembersCommand command = new(channel.Id, ownerId, [newUserId1, newUserId2]);

        Result<int> result = await handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(2);

        Channel updated = _context.Channels.First(c => c.Id == channel.Id);
        updated.Members.Should().HaveCount(3);
    }

    [Fact]
    public async Task Handle_WhenChannelIsDirect_ShouldReturnValidationFailure()
    {
        Guid u1 = Guid.NewGuid();
        Guid u2 = Guid.NewGuid();
        Guid u3 = Guid.NewGuid();

        Channel direct = Channel.CreateDirect(u1, u2);
        _context.Channels.Add(direct);
        await _context.SaveChangesAsync();

        AddChannelMembersCommandHandler handler = new(_context);
        AddChannelMembersCommand command = new(direct.Id, u1, [u3]);

        Result<int> result = await handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Validation);
    }
}
