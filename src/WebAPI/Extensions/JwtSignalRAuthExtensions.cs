using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;

namespace MessengerApp.WebAPI.Extensions;

public static class JwtSignalRAuthExtensions
{
    public const string DefaultChatHubPath = "/hubs/chat";
    public const string QueryTokenKey = "access_token";

    // Browser WebSockets cannot send Authorization headers in handshake; extract token from query string
    public static JwtBearerOptions ConfigureSignalRAuthentication(
        this JwtBearerOptions options,
        string hubPath = DefaultChatHubPath)
    {
        Func<MessageReceivedContext, Task>? existingOnMessageReceived = options.Events?.OnMessageReceived;

        options.Events ??= new JwtBearerEvents();
        options.Events.OnMessageReceived = async context =>
        {
            if (existingOnMessageReceived != null)
            {
                await existingOnMessageReceived(context);
            }

            string? accessToken = context.Request.Query[QueryTokenKey];
            PathString path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments(hubPath))
            {
                context.Token = accessToken;
            }
        };

        return options;
    }
}
