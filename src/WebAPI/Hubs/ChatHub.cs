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

    protected string CurrentUsername
    {
        get
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value
                ?? Context.User?.FindFirst("name")?.Value
                ?? "Someone";
        }
    }

    public override async Task OnConnectedAsync()
    {
        Guid userId = CurrentUserId;
        if (userId == Guid.Empty)
        {
            logger.LogWarning("Unauthorized connection attempt rejected on ChatHub: {ConnectionId}", Context.ConnectionId);
            Context.Abort();
            return;
        }

        try
        {
            bool isFirstConnection = await presenceTracker.ConnectionOpenedAsync(userId, Context.ConnectionId);
            List<Guid> peerUserIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => dbContext.ChannelMembers
                    .Where(my => my.UserId == userId)
                    .Select(my => my.ChannelId)
                    .Contains(m.ChannelId) && m.UserId != userId)
                .Select(m => m.UserId)
                .Distinct()
                .ToListAsync(Context.ConnectionAborted);

            if (isFirstConnection && peerUserIds.Count > 0)
            {
                await Clients.Users(peerUserIds.Select(id => id.ToString()).ToList()).UserConnected(userId);
            }
            IReadOnlyCollection<Guid> allOnlineUsers = await presenceTracker.GetOnlineUsersAsync();
            List<Guid> relevantOnlineUsers = peerUserIds.Intersect(allOnlineUsers).ToList();
            await Clients.Caller.OnlineUsers(relevantOnlineUsers);

            await base.OnConnectedAsync();
        }
        catch (OperationCanceledException)
        {
            logger.LogDebug("Connection setup was canceled for {ConnectionId}", Context.ConnectionId);
        }
    }
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Guid userId = CurrentUserId;
        if (userId != Guid.Empty)
        {
            try
            {
                bool isLastConnection = await presenceTracker.ConnectionClosedAsync(userId, Context.ConnectionId);
                if (isLastConnection)
                {
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                    CancellationToken timeoutCt = cts.Token;

                    List<Guid> peerUserIds = await dbContext.ChannelMembers
                        .AsNoTracking()
                        .Where(m => dbContext.ChannelMembers
                            .Where(my => my.UserId == userId)
                            .Select(my => my.ChannelId)
                            .Contains(m.ChannelId) && m.UserId != userId)
                        .Select(m => m.UserId)
                        .Distinct()
                        .ToListAsync(timeoutCt);

                    if (peerUserIds.Count > 0)
                    {
                        await Clients.Users(peerUserIds.Select(id => id.ToString()).ToList()).UserDisconnected(userId);
                    }

                    await dbContext.Users
                        .Where(u => u.Id == userId)
                        .ExecuteUpdateAsync(s => s.SetProperty(u => u.LastSeenAt, DateTimeOffset.UtcNow), timeoutCt);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to broadcast disconnect / update LastSeenAt for user {UserId}", userId);
            }
        }

        if (exception != null)
        {
            logger.LogWarning(exception, "Client {UserId} disconnected abnormally: {ConnectionId}", userId, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
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

        List<string> memberUserIds = await dbContext.ChannelMembers
            .AsNoTracking()
            .Where(m => m.ChannelId == channelId)
            .Select(m => m.UserId.ToString())
            .ToListAsync(Context.ConnectionAborted);

        if (memberUserIds.Count > 0)
        {
            await Clients.Users(memberUserIds).ReceiveMessage(message);
        }
    }

    public static string GetChannelGroupName(Guid channelId) => $"channel:{channelId}";

    public async Task JoinChannel(Guid channelId)
    {
        Guid userId = CurrentUserId;
        if (userId == Guid.Empty || channelId == Guid.Empty)
        {
            throw new HubException("Invalid authentication or channel identifier.");
        }

        // BOLA / Group Poisoning Defense: verify membership and channel active status
        bool isMember = await dbContext.ChannelMembers
            .AsNoTracking()
            .AnyAsync(m => m.ChannelId == channelId && m.UserId == userId && !m.Channel.IsDeleted, Context.ConnectionAborted);

        if (!isMember)
        {
            logger.LogWarning("Security violation: User {UserId} attempted unauthorized join to channel {ChannelId}", userId, channelId);
            await Clients.Caller.HubError("FORBIDDEN_CHANNEL_ACCESS", "You are not a member of this channel.");
            throw new HubException("Access denied: You are not authorized to join this channel.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GetChannelGroupName(channelId));
    }

    public async Task LeaveChannelGroup(Guid channelId)
    {
        if (channelId == Guid.Empty) return;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetChannelGroupName(channelId));
    }

    public async Task SendTyping(Guid channelId)
    {
        Guid userId = CurrentUserId;
        if (userId == Guid.Empty || channelId == Guid.Empty) return;

        await Clients.OthersInGroup(GetChannelGroupName(channelId)).UserTyping(channelId, userId, CurrentUsername);
    }

    public async Task SendStoppedTyping(Guid channelId)
    {
        Guid userId = CurrentUserId;
        if (userId == Guid.Empty || channelId == Guid.Empty) return;

        await Clients.OthersInGroup(GetChannelGroupName(channelId)).UserStoppedTyping(channelId, userId);
    }
}
