using FluentAssertions;
using MessengerApp.Application.Auth.Commands.Logout;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Auth;

public class LogoutCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IClientInfoProvider _clientInfoProvider = Substitute.For<IClientInfoProvider>();
    private readonly LogoutCommandHandler _handler;

    public LogoutCommandHandlerTests()
    {
        _clientInfoProvider.ClientIpAddress.Returns("192.168.1.100");
        _handler = new LogoutCommandHandler(_context, _clientInfoProvider);
    }

    [Fact]
    public async Task Handle_WithActiveToken_ShouldRevokeTokenAndReturnSuccess()
    {
        var user = User.Create("user@example.com", "logoutuser", "hash", null);
        _context.Users.Add(user);

        var activeToken = new RefreshToken(user.Id, "active_token_to_logout", DateTimeOffset.UtcNow.AddDays(7), "127.0.0.1");
        _context.RefreshTokens.Add(activeToken);
        await _context.SaveChangesAsync();

        var command = new LogoutCommand("active_token_to_logout");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        activeToken.IsRevoked.Should().BeTrue();
        activeToken.RevokedByIp.Should().Be("192.168.1.100");
    }

    [Fact]
    public async Task Handle_WithEmptyOrNonExistentToken_ShouldSucceedIdempotently()
    {
        var command = new LogoutCommand("non_existent_token");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }
}
