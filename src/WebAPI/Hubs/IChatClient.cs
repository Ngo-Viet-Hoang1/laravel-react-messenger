using MessengerApp.Application.Messages.Common;

namespace MessengerApp.WebAPI.Hubs;

public interface IChatClient
{
    Task ReceiveMessage(object message);

    Task UserConnected(Guid userId);

    Task UserDisconnected(Guid userId);

    Task OnlineUsers(IReadOnlyCollection<Guid> userIds);

    Task UserTyping(Guid channelId, Guid userId, string username);

    Task UserStoppedTyping(Guid channelId, Guid userId);

    Task MessageReactionUpdated(Guid messageId, Guid channelId, IReadOnlyList<ReactionGroupDto> reactions);

    Task ChannelUpdated(Guid channelId);

    Task ChannelMembersUpdated(Guid channelId);

    Task ChannelDeleted(Guid channelId);

    Task HubError(string code, string message);
}
