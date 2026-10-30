using FluentAssertions;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Channels.Queries.GetChannelMembers;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class GetChannelMembersQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_WhenCallerIsMember_ShouldReturnMembersOrderedByRole()
    {
        Guid ownerId = Guid.NewGuid();
        Guid memberId = Guid.NewGuid();

        User owner = User.Create("owner@example.com", "owner", "pwd");
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(owner, ownerId);

        User member = User.Create("member@example.com", "member", "pwd");
        typeof(User).GetProperty(nameof(User.Id))!.SetValue(member, memberId);

        _context.Users.AddRange(owner, member);

        Channel channel = Channel.CreateGroup("General", ownerId);
        channel.AddMember(memberId, ChannelMemberRole.Member);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        GetChannelMembersQueryHandler handler = new(_context);
        GetChannelMembersQuery query = new(channel.Id, memberId);

        Result<List<ChannelMemberDto>> result = await handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
        result.Value[0].Role.Should().Be(ChannelMemberRole.Owner);
        result.Value[0].Username.Should().Be("owner");
        result.Value[1].Role.Should().Be(ChannelMemberRole.Member);
        result.Value[1].Username.Should().Be("member");
    }

    [Fact]
    public async Task Handle_WhenCallerNotMember_ShouldReturnForbidden()
    {
        Guid ownerId = Guid.NewGuid();
        Guid strangerId = Guid.NewGuid();

        Channel channel = Channel.CreateGroup("Secret", ownerId);
        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();

        GetChannelMembersQueryHandler handler = new(_context);
        GetChannelMembersQuery query = new(channel.Id, strangerId);

        Result<List<ChannelMemberDto>> result = await handler.Handle(query, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Type.Should().Be(ErrorType.Forbidden);
    }
}
