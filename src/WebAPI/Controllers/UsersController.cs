using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.Users.Queries.SearchUsers;
using MessengerApp.Domain.Common;
using MessengerApp.WebAPI.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MessengerApp.WebAPI.Controllers;

[Authorize]
[Route("api/[controller]")]
public class UsersController(ISender sender) : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedList<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SearchUsers(
        [FromQuery] string? search,
        [FromQuery] PaginationParams? pagination,
        CancellationToken ct = default)
    {
        SearchUsersQuery query = new(CurrentUserId, search, pagination);
        Result<PaginatedList<UserDto>> result = await sender.Send(query, ct);
        return HandleResult(result);
    }
}
