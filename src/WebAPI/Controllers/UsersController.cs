using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Users.Commands.ChangePassword;
using MessengerApp.Application.Users.Commands.UpdateProfile;
using MessengerApp.Application.Users.Queries.SearchUsers;
using MessengerApp.Domain.Common;
using MessengerApp.WebAPI.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MessengerApp.WebAPI.Controllers;

public record UpdateProfileRequest(string Username, string? AvatarUrl);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

[Authorize]
[Route("api/[controller]")]
public class UsersController(ISender sender) : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedList<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SearchUsers(
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        SearchUsersQuery query = new(CurrentUserId, search, new PaginationParams(pageNumber, pageSize));
        Result<PaginatedList<UserDto>> result = await sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPut("profile")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken ct = default)
    {
        UpdateProfileCommand command = new(CurrentUserId, request.Username, request.AvatarUrl);
        Result<UserDto> result = await sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken ct = default)
    {
        ChangePasswordCommand command = new(CurrentUserId, request.CurrentPassword, request.NewPassword);
        Result result = await sender.Send(command, ct);
        return HandleNoContentResult(result);
    }
}
