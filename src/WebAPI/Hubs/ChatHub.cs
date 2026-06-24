using System.Security.Claims;
using MessengerApp.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.WebAPI.Hubs;

[Authorize]
public class ChatHub(
    IApplicationDbContext dbContext,
    ILogger<ChatHub> logger) : Hub<IChatClient>
{
    protected Guid CurrentUserId
    {
        get
        {
            string? idClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? Context.User?.FindFirst("sub")?.Value;

            return Guid.TryParse(idClaim, out Guid userId) ? userId : Guid.Empty;
        }
    }

    public static string GetChannelGroupName(Guid channelId) => $"channel:{channelId}";

    public override Task OnConnectedAsync()
    {
        if (CurrentUserId == Guid.Empty)
        {
            logger.LogWarning("Unauthorized connection attempt rejected on ChatHub: {ConnectionId}", Context.ConnectionId);
            Context.Abort();
        }

        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            logger.LogWarning(exception, "Client {UserId} disconnected abnormally: {ConnectionId}", CurrentUserId, Context.ConnectionId);
        }

        return base.OnDisconnectedAsync(exception);
    }

    public async Task JoinChannel(Guid channelId)
    {
        Guid userId = CurrentUserId;
        if (userId == Guid.Empty || channelId == Guid.Empty)
        {
            throw new HubException("Invalid authentication or channel identifier.");
        }

        // BOLA / Group Poisoning Defense: verify membership in database before group admission
        bool isMember = await dbContext.ChannelMembers
            .AsNoTracking()
            .AnyAsync(m => m.ChannelId == channelId && m.UserId == userId && !m.Channel.IsDeleted);

        if (!isMember)
        {
            logger.LogWarning("Security violation: User {UserId} attempted unauthorized join to channel {ChannelId}", userId, channelId);
            await Clients.Caller.HubError("FORBIDDEN_CHANNEL_ACCESS", "You are not a member of this channel.");
            throw new HubException("Access denied: You are not authorized to join this channel.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GetChannelGroupName(channelId));
        await Clients.Caller.ChannelJoined(channelId);
    }

    public async Task LeaveChannel(Guid channelId)
    {
        if (channelId == Guid.Empty) return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetChannelGroupName(channelId));
        await Clients.Caller.ChannelLeft(channelId);
    }
}
