using MediatR;
using MessengerApp.Application.Auth.Commands.Login;
using MessengerApp.Application.Auth.Commands.Logout;
using MessengerApp.Application.Auth.Commands.RefreshToken;
using MessengerApp.Application.Auth.Commands.Register;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Auth.Queries.GetCurrentUser;
using MessengerApp.WebAPI.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MessengerApp.WebAPI.Controllers;

[Route("api/[controller]")]
public class AuthController(ISender sender) : ApiController
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken ct)
        => HandleCreatedResult(await sender.Send(command, ct));

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
        => HandleResult(await sender.Send(command, ct));

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command, CancellationToken ct)
        => HandleResult(await sender.Send(command, ct));

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logout([FromBody] LogoutCommand command, CancellationToken ct)
        => HandleNoContentResult(await sender.Send(command, ct));

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
        => HandleResult(await sender.Send(new GetCurrentUserQuery(CurrentUserId), ct));
}
