using System.Security.Claims;
using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Messages.Commands.SendMessage;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.WebAPI.Hubs;

[Authorize]
public class ChatHub(
    IApplicationDbContext dbContext,
    IPresenceTracker presenceTracker,
    ISender sender,
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

    public override async Task OnConnectedAsync()
    {
        Guid userId = CurrentUserId;
        if (userId == Guid.Empty)
        {
            logger.LogWarning("Unauthorized connection attempt rejected on ChatHub: {ConnectionId}", Context.ConnectionId);
            Context.Abort();
            return;
        }
        bool isFirstConnection = await presenceTracker.ConnectionOpenedAsync(userId, Context.ConnectionId);
        List<Guid> peerUserIds = await dbContext.ChannelMembers
            .AsNoTracking()
            .Where(m => dbContext.ChannelMembers
                .Where(my => my.UserId == userId)
                .Select(my => my.ChannelId)
                .Contains(m.ChannelId) && m.UserId != userId)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync();

        if (isFirstConnection && peerUserIds.Count > 0)
        {
            await Clients.Users(peerUserIds.Select(id => id.ToString()).ToList()).UserConnected(userId);
        }
        IReadOnlyCollection<Guid> allOnlineUsers = await presenceTracker.GetOnlineUsersAsync();
        List<Guid> relevantOnlineUsers = peerUserIds.Intersect(allOnlineUsers).ToList();
        await Clients.Caller.OnlineUsers(relevantOnlineUsers);
        await base.OnConnectedAsync();
    }
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Guid userId = CurrentUserId;
        if (userId != Guid.Empty)
        {
            bool isLastConnection = await presenceTracker.ConnectionClosedAsync(userId, Context.ConnectionId);
            if (isLastConnection)
            {
                List<Guid> peerUserIds = await dbContext.ChannelMembers
                    .AsNoTracking()
                    .Where(m => dbContext.ChannelMembers
                        .Where(my => my.UserId == userId)
                        .Select(my => my.ChannelId)
                        .Contains(m.ChannelId) && m.UserId != userId)
                    .Select(m => m.UserId)
                    .Distinct()
                    .ToListAsync();
                if (peerUserIds.Count > 0)
                {
                    await Clients.Users(peerUserIds.Select(id => id.ToString()).ToList()).UserDisconnected(userId);
                }
                try
                {
                    await dbContext.Users
                        .Where(u => u.Id == userId)
                        .ExecuteUpdateAsync(s => s.SetProperty(u => u.LastSeenAt, DateTimeOffset.UtcNow));
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to update LastSeenAt for user {UserId}", userId);
                }
            }
        }

        if (exception != null)
        {
            logger.LogWarning(exception, "Client {UserId} disconnected abnormally: {ConnectionId}", userId, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
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
    }

    public async Task LeaveChannel(Guid channelId)
    {
        if (channelId == Guid.Empty) return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetChannelGroupName(channelId));
    }

    public async Task SendMessage(Guid channelId, string content, string? clientMessageId = null)
    {
        Guid userId = CurrentUserId;
        if (userId == Guid.Empty || channelId == Guid.Empty)
        {
            throw new HubException("Invalid authentication or channel identifier.");
        }

        SendMessageCommand command = new(userId, channelId, content, clientMessageId);
        Result<MessageDto> result = await sender.Send(command);

        if (result.IsFailure)
        {
            logger.LogWarning("Message dispatch rejected for User {UserId} in Channel {ChannelId}: {ErrorCode} - {ErrorDesc}",
                userId, channelId, result.Error.Code, result.Error.Description);
            await Clients.Caller.HubError(result.Error.Code, result.Error.Description);
            return;
        }

        MessageDto message = result.Value;
        await Clients.Group(GetChannelGroupName(channelId)).ReceiveMessage(message);
    }
}
