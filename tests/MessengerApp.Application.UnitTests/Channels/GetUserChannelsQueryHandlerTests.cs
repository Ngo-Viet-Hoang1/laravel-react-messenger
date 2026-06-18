using FluentAssertions;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Channels.Queries.GetUserChannels;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;
using Xunit;

namespace MessengerApp.Application.UnitTests.Channels;

public class GetUserChannelsQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();

    [Fact]
    public async Task Handle_ShouldReturnChannelsUserBelongsTo_WithCorrectDynamicDirectName()
    {
        User currentUser = User.Create("alice@example.com", "alice", "Hash123!");
        User otherUser = User.Create("bob@example.com", "bob", "Hash123!");
        _context.Users.AddRange(currentUser, otherUser);

        Channel joinedGroupChannel = Channel.CreateGroup("General", currentUser.Id, "General Chat");
        Channel directChannel = Channel.CreateDirect(currentUser.Id, otherUser.Id);
        Channel unjoinedGroupChannel = Channel.CreateGroup("Secret", otherUser.Id, "Secret Chat");

        _context.Channels.AddRange(joinedGroupChannel, directChannel, unjoinedGroupChannel);
        await _context.SaveChangesAsync(CancellationToken.None);

        GetUserChannelsQueryHandler handler = new(_context);
        GetUserChannelsQuery query = new(currentUser.Id);

        Result<List<ChannelSummaryDto>> result = await handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);

        ChannelSummaryDto? returnedDirect = result.Value.FirstOrDefault(c => c.Type == ChannelType.Direct);
        returnedDirect.Should().NotBeNull();
        returnedDirect!.Name.Should().Be("bob");

        ChannelSummaryDto? returnedGroup = result.Value.FirstOrDefault(c => c.Type == ChannelType.Group);
        returnedGroup.Should().NotBeNull();
        returnedGroup!.Name.Should().Be("General");
    }

    [Fact]
    public async Task Handle_ShouldExcludeDeletedChannels()
    {
        User currentUser = User.Create("alice@example.com", "alice", "Hash123!");
        _context.Users.Add(currentUser);

        Channel activeChannel = Channel.CreateGroup("ActiveGroup", currentUser.Id);
        Channel deletedChannel = Channel.CreateGroup("DeletedGroup", currentUser.Id);
        deletedChannel.IsDeleted = true;

        _context.Channels.AddRange(activeChannel, deletedChannel);
        await _context.SaveChangesAsync(CancellationToken.None);

        GetUserChannelsQueryHandler handler = new(_context);
        GetUserChannelsQuery query = new(currentUser.Id);

        Result<List<ChannelSummaryDto>> result = await handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().ContainSingle();
        result.Value.First().Name.Should().Be("ActiveGroup");
    }
}
