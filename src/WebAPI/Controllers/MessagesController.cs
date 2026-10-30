using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Messages.Commands.ToggleReaction;
using MessengerApp.Domain.Common;
using MessengerApp.WebAPI.Common;
using MessengerApp.WebAPI.Contracts.Messages;
using MessengerApp.WebAPI.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.WebAPI.Controllers;

[Authorize]
[Route("api/[controller]")]
public class MessagesController(
    ISender sender,
    IApplicationDbContext dbContext,
    IHubContext<ChatHub, IChatClient> hubContext) : ApiController
{
    [HttpPost("{messageId:guid}/reactions")]
    [ProducesResponseType(typeof(ToggleReactionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleReaction(
        Guid messageId,
        [FromBody] ToggleReactionRequest request,
        CancellationToken ct)
    {
        ToggleReactionCommand command = new(CurrentUserId, messageId, request.Emoji);
        Result<ToggleReactionResponse> result = await sender.Send(command, ct);

        if (result.IsSuccess)
        {
            List<string> memberUserIds = await dbContext.ChannelMembers
                .AsNoTracking()
                .Where(m => m.ChannelId == result.Value.ChannelId)
                .Select(m => m.UserId.ToString())
                .ToListAsync(ct);

            if (memberUserIds.Count > 0)
            {
                await hubContext.Clients.Users(memberUserIds)
                    .MessageReactionUpdated(result.Value.MessageId, result.Value.ChannelId, result.Value.Reactions);
            }
        }

        return HandleResult(result);
    }
}
