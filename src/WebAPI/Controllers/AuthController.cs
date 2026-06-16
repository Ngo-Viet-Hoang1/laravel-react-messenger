using MediatR;
using MessengerApp.Application.Auth.Commands.GoogleLogin;
using MessengerApp.Application.Auth.Commands.Login;
using MessengerApp.Application.Auth.Commands.Logout;
using MessengerApp.Application.Auth.Commands.RefreshToken;
using MessengerApp.Application.Auth.Commands.Register;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Auth.Queries.GetCurrentUser;
using MessengerApp.WebAPI.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace MessengerApp.WebAPI.Controllers;

[Route("api/[controller]")]
public class AuthController(ISender sender) : ApiController
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        if (result.IsSuccess)
        {
            AuthCookieHelper.SetRefreshToken(Response, Request, result.Value.RefreshToken, result.Value.ExpiresAt);
        }
        return HandleCreatedResult(result);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        if (result.IsSuccess)
        {
            AuthCookieHelper.SetRefreshToken(Response, Request, result.Value.RefreshToken, result.Value.ExpiresAt);
        }
        return HandleResult(result);
    }

    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        if (result.IsSuccess)
        {
            AuthCookieHelper.SetRefreshToken(Response, Request, result.Value.RefreshToken, result.Value.ExpiresAt);
        }
        return HandleResult(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshTokenCommand? command,
        CancellationToken ct)
    {
        var token = command?.RefreshToken ?? AuthCookieHelper.GetRefreshToken(Request);

        var result = await sender.Send(new RefreshTokenCommand(token), ct);
        if (result.IsSuccess)
        {
            AuthCookieHelper.SetRefreshToken(Response, Request, result.Value.RefreshToken, result.Value.ExpiresAt);
        }
        return HandleResult(result);
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] LogoutCommand? command,
        CancellationToken ct)
    {
        var token = command?.RefreshToken ?? AuthCookieHelper.GetRefreshToken(Request);

        var result = await sender.Send(new LogoutCommand(token ?? string.Empty), ct);
        AuthCookieHelper.DeleteRefreshToken(Response, Request);
        return HandleNoContentResult(result);
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken ct)
        => HandleResult(await sender.Send(new GetCurrentUserQuery(CurrentUserId), ct));
}
