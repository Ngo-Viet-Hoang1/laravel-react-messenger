using MediatR;
using MessengerApp.Application.Channels.Commands.CreateChannel;
using MessengerApp.Application.Channels.Commands.GetOrCreateDirectChannel;
using MessengerApp.Application.Channels.Common;
using MessengerApp.Application.Channels.Queries.GetChannelById;
using MessengerApp.Application.Channels.Queries.GetUserChannels;
using MessengerApp.Domain.Common;
using MessengerApp.WebAPI.Common;
using MessengerApp.WebAPI.Contracts.Channels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
}
