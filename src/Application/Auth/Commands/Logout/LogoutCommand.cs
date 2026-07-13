using MediatR;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Auth.Commands.Logout;

public record LogoutCommand(string? RefreshToken = null) : IRequest<Result>;

public class LogoutCommandHandler(
    IApplicationDbContext context,
    IClientInfoProvider clientInfoProvider) : IRequestHandler<LogoutCommand, Result>
{
    public async Task<Result> Handle(LogoutCommand cmd, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(cmd.RefreshToken))
        {
            var token = await context.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == cmd.RefreshToken, ct);

            if (token != null && token.IsActive)
            {
                token.Revoke(clientInfoProvider.ClientIpAddress);
                await context.SaveChangesAsync(ct);
            }
        }

        return Result.Success();
    }
}
