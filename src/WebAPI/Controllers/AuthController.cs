using System.Security.Claims;
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
}
