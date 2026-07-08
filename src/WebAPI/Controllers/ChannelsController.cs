using MediatR;
using MessengerApp.Application.Channels.Commands.AddChannelMembers;
using MessengerApp.Application.Channels.Commands.CreateChannel;
using MessengerApp.Application.Channels.Commands.DeleteChannel;
using MessengerApp.Application.Channels.Commands.GetOrCreateDirectChannel;
using MessengerApp.Application.Channels.Commands.LeaveChannel;
using MessengerApp.Application.Channels.Commands.MarkChannelAsRead;
using MessengerApp.Application.Channels.Commands.RemoveChannelMember;
using MessengerApp.Application.Channels.Commands.UpdateChannel;
using MessengerApp.Application.Channels.Commands.UpdateChannelMemberRole;
using MessengerApp.Application.Channels.Commands.TransferChannelOwnership;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Channels.Queries.GetChannelById;
using MessengerApp.Application.Channels.Queries.GetChannelMembers;
using MessengerApp.Application.Channels.Queries.GetUserChannels;
using MessengerApp.Application.Messages.Commands.SendMessage;
using MessengerApp.Application.Messages.Common;
using MessengerApp.Application.Messages.Queries.GetChannelMessages;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Models;
using MessengerApp.Domain.Common;
using MessengerApp.WebAPI.Common;
using MessengerApp.WebAPI.Contracts.Channels;
using MessengerApp.WebAPI.Contracts.Messages;
using MessengerApp.WebAPI.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.WebAPI.Controllers;

[Authorize]
[Route("api/[controller]")]
public class ChannelsController(ISender sender) : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(List<ChannelSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUserChannels(CancellationToken ct)
    {
        Result<List<ChannelSummaryDto>> result = await sender.Send(new GetUserChannelsQuery(CurrentUserId), ct);
        return HandleResult(result);
    }

    [HttpGet("{channelId:guid}")]
    [ProducesResponseType(typeof(ChannelDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetChannelById([FromRoute] Guid channelId, CancellationToken ct)
    {
        Result<ChannelDetailDto> result = await sender.Send(new GetChannelByIdQuery(channelId, CurrentUserId), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ChannelDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateChannel([FromBody] CreateChannelRequest request, CancellationToken ct)
    {
        CreateChannelCommand command = new(
            CurrentUserId,
            request.Name,
            request.Description,
            request.AvatarUrl,
            request.MemberIds);

        Result<ChannelDetailDto> result = await sender.Send(command, ct);
        return HandleCreatedResult(result);
    }

    [HttpPost("direct/{targetUserId:guid}")]
    [ProducesResponseType(typeof(ChannelDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOrCreateDirectChannel([FromRoute] Guid targetUserId, CancellationToken ct)
    {
        GetOrCreateDirectChannelCommand command = new(CurrentUserId, targetUserId);
        Result<ChannelDetailDto> result = await sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpGet("{channelId:guid}/messages")]
    [ProducesResponseType(typeof(CursorPagedList<MessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetChannelMessages(
        [FromRoute] Guid channelId,
        [FromQuery] DateTimeOffset? before = null,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        GetChannelMessagesQuery query = new(channelId, CurrentUserId, before, limit);
        Result<CursorPagedList<MessageDto>> result = await sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPost("{channelId:guid}/messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SendMessage(
        [FromRoute] Guid channelId,
        [FromBody] SendMessageRequest request,
        [FromServices] IHubContext<ChatHub, IChatClient> hubContext,
        [FromServices] IApplicationDbContext dbContext,
        CancellationToken ct)
    {
        SendMessageCommand command = new(CurrentUserId, channelId, request.Content, request.ClientMessageId, request.ParentMessageId);
        Result<MessageDto> result = await sender.Send(command, ct);

        if (result.IsSuccess)
        {
            List<string> memberUserIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => m.ChannelId == channelId)
                .Select(m => m.UserId.ToString())
                .ToListAsync(ct);

            if (memberUserIds.Count > 0)
            {
                await hubContext.Clients.Users(memberUserIds).ReceiveMessage(result.Value);
            }
        }

        return HandleCreatedResult(result);
    }

    [HttpPost("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAsRead([FromRoute] Guid id)
    {
        Result result = await sender.Send(new MarkChannelAsReadCommand(id, CurrentUserId));
        return HandleNoContentResult(result);
    }

    [HttpGet("{channelId:guid}/members")]
    [ProducesResponseType(typeof(List<ChannelMemberDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetChannelMembers([FromRoute] Guid channelId, CancellationToken ct)
    {
        Result<List<ChannelMemberDto>> result = await sender.Send(new GetChannelMembersQuery(channelId, CurrentUserId), ct);
        return HandleResult(result);
    }

    [HttpPost("{channelId:guid}/members")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddChannelMembers(
        [FromRoute] Guid channelId,
        [FromBody] AddChannelMembersRequest request,
        [FromServices] IHubContext<ChatHub, IChatClient> hubContext,
        [FromServices] IApplicationDbContext dbContext,
        CancellationToken ct)
    {
        AddChannelMembersCommand command = new(channelId, CurrentUserId, request.MemberIds);
        Result<int> result = await sender.Send(command, ct);

        if (result.IsSuccess && result.Value > 0)
        {
            List<string> memberUserIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => m.ChannelId == channelId)
                .Select(m => m.UserId.ToString())
                .ToListAsync(ct);

            if (memberUserIds.Count > 0)
            {
                await hubContext.Clients.Users(memberUserIds).ChannelMembersUpdated(channelId);
                await hubContext.Clients.Users(memberUserIds).ChannelUpdated(channelId);
            }
        }

        return HandleResult(result);
    }

    [HttpPut("{channelId:guid}")]
    [ProducesResponseType(typeof(ChannelDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateChannel(
        [FromRoute] Guid channelId,
        [FromBody] UpdateChannelRequest request,
        [FromServices] IHubContext<ChatHub, IChatClient> hubContext,
        [FromServices] IApplicationDbContext dbContext,
        CancellationToken ct)
    {
        UpdateChannelCommand command = new(channelId, CurrentUserId, request.Name, request.Description, request.AvatarUrl);
        Result<ChannelDetailDto> result = await sender.Send(command, ct);

        if (result.IsSuccess)
        {
            List<string> memberUserIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => m.ChannelId == channelId)
                .Select(m => m.UserId.ToString())
                .ToListAsync(ct);

            if (memberUserIds.Count > 0)
            {
                await hubContext.Clients.Users(memberUserIds).ChannelUpdated(channelId);
            }
        }

        return HandleResult(result);
    }

    [HttpDelete("{channelId:guid}/members/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RemoveChannelMember(
        [FromRoute] Guid channelId,
        [FromRoute] Guid userId,
        [FromServices] IHubContext<ChatHub, IChatClient> hubContext,
        [FromServices] IApplicationDbContext dbContext,
        CancellationToken ct)
    {
        RemoveChannelMemberCommand command = new(channelId, CurrentUserId, userId);
        Result result = await sender.Send(command, ct);

        if (result.IsSuccess)
        {
            List<string> remainingMemberIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => m.ChannelId == channelId)
                .Select(m => m.UserId.ToString())
                .ToListAsync(ct);

            if (remainingMemberIds.Count > 0)
            {
                await hubContext.Clients.Users(remainingMemberIds).ChannelMembersUpdated(channelId);
            }

            await hubContext.Clients.User(userId.ToString()).ChannelDeleted(channelId);
        }

        return HandleNoContentResult(result);
    }

    [HttpPut("{channelId:guid}/members/{userId:guid}/role")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateChannelMemberRole(
        [FromRoute] Guid channelId,
        [FromRoute] Guid userId,
        [FromBody] UpdateChannelMemberRoleRequest request,
        [FromServices] IHubContext<ChatHub, IChatClient> hubContext,
        [FromServices] IApplicationDbContext dbContext,
        CancellationToken ct)
    {
        UpdateChannelMemberRoleCommand command = new(channelId, CurrentUserId, userId, request.Role);
        Result result = await sender.Send(command, ct);

        if (result.IsSuccess)
        {
            List<string> memberIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => m.ChannelId == channelId)
                .Select(m => m.UserId.ToString())
                .ToListAsync(ct);

            if (memberIds.Count > 0)
            {
                await hubContext.Clients.Users(memberIds).ChannelMembersUpdated(channelId);
            }
        }

        return HandleNoContentResult(result);
    }

    [HttpPost("{channelId:guid}/transfer-ownership")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> TransferChannelOwnership(
        [FromRoute] Guid channelId,
        [FromBody] TransferChannelOwnershipRequest request,
        [FromServices] IHubContext<ChatHub, IChatClient> hubContext,
        [FromServices] IApplicationDbContext dbContext,
        CancellationToken ct)
    {
        TransferChannelOwnershipCommand command = new(channelId, CurrentUserId, request.NewOwnerId);
        Result result = await sender.Send(command, ct);

        if (result.IsSuccess)
        {
            List<string> memberIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => m.ChannelId == channelId)
                .Select(m => m.UserId.ToString())
                .ToListAsync(ct);

            if (memberIds.Count > 0)
            {
                await hubContext.Clients.Users(memberIds).ChannelMembersUpdated(channelId);
            }
        }

        return HandleNoContentResult(result);
    }

    [HttpPost("{channelId:guid}/leave")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LeaveChannel(
        [FromRoute] Guid channelId,
        [FromServices] IHubContext<ChatHub, IChatClient> hubContext,
        [FromServices] IApplicationDbContext dbContext,
        CancellationToken ct)
    {
        LeaveChannelCommand command = new(channelId, CurrentUserId);
        Result result = await sender.Send(command, ct);

        if (result.IsSuccess)
        {
            List<string> remainingMemberIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => m.ChannelId == channelId)
                .Select(m => m.UserId.ToString())
                .ToListAsync(ct);

            if (remainingMemberIds.Count > 0)
            {
                await hubContext.Clients.Users(remainingMemberIds).ChannelMembersUpdated(channelId);
            }

            await hubContext.Clients.User(CurrentUserId.ToString()).ChannelDeleted(channelId);
        }

        return HandleNoContentResult(result);
    }

    [HttpDelete("{channelId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteChannel(
        [FromRoute] Guid channelId,
        [FromServices] IHubContext<ChatHub, IChatClient> hubContext,
        [FromServices] IApplicationDbContext dbContext,
        CancellationToken ct)
    {
        List<string> memberUserIds = await dbContext.ChannelMembers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m => m.ChannelId == channelId)
            .Select(m => m.UserId.ToString())
            .ToListAsync(ct);

        DeleteChannelCommand command = new(channelId, CurrentUserId);
        Result result = await sender.Send(command, ct);

        if (result.IsSuccess && memberUserIds.Count > 0)
        {
            await hubContext.Clients.Users(memberUserIds).ChannelDeleted(channelId);
        }

        return HandleNoContentResult(result);
    }
}
