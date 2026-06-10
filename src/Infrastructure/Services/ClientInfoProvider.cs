using MessengerApp.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace MessengerApp.Infrastructure.Services;

public class ClientInfoProvider(IHttpContextAccessor httpContextAccessor) : IClientInfoProvider
{
    public string? ClientIpAddress =>
        httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
}
