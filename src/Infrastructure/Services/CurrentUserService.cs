using System.Security.Claims;
using MessengerApp.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace MessengerApp.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public string? UserId =>
        httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
}
