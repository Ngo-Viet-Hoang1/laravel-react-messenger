using FluentAssertions;
using MessengerApp.Application.Auth.Commands.RefreshToken;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Auth;

public class RefreshTokenCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IJwtTokenService _jwtTokenService = Substitute.For<IJwtTokenService>();
    private readonly IClientInfoProvider _clientInfoProvider = Substitute.For<IClientInfoProvider>();
    private readonly RefreshTokenCommandHandler _handler;

    public RefreshTokenCommandHandlerTests()
    {
        _clientInfoProvider.ClientIpAddress.Returns("127.0.0.1");
        _jwtTokenService.GenerateAccessToken(Arg.Any<User>()).Returns("new_access_token");
        _jwtTokenService.GenerateRefreshToken(Arg.Any<Guid>(), Arg.Any<string>())
            .Returns(callInfo => new RefreshToken(callInfo.Arg<Guid>(), "new_rotated_refresh_token", DateTimeOffset.UtcNow.AddDays(7), "127.0.0.1"));

        _handler = new RefreshTokenCommandHandler(_context, _jwtTokenService, _clientInfoProvider);
    }

    [Fact]
    public async Task Handle_WithValidToken_ShouldRotateAndReturnNewTokens()
    {
        var user = User.Create("alice@example.com", "alice", "hash", null);
        _context.Users.Add(user);

        var existingToken = new RefreshToken(user.Id, "valid_old_token", DateTimeOffset.UtcNow.AddDays(7), "127.0.0.1");
        _context.RefreshTokens.Add(existingToken);
        await _context.SaveChangesAsync();

        var command = new RefreshTokenCommand("valid_old_token");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("new_access_token");
        result.Value.RefreshToken.Should().Be("new_rotated_refresh_token");

        existingToken.IsRevoked.Should().BeTrue();
        existingToken.ReplacedByToken.Should().Be("new_rotated_refresh_token");

        var newTokenInDb = _context.RefreshTokens.FirstOrDefault(t => t.Token == "new_rotated_refresh_token");
        newTokenInDb.Should().NotBeNull();
        newTokenInDb!.UserId.Should().Be(user.Id);
    }

    [Fact]
    public async Task Handle_WithEmptyToken_ShouldReturnUnauthorized()
    {
        var command = new RefreshTokenCommand(null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.MissingRefreshToken");
    }

    [Fact]
    public async Task Handle_WithExpiredToken_ShouldReturnUnauthorized()
    {
        var user = User.Create("bob@example.com", "bob", "hash", null);
        _context.Users.Add(user);

        var expiredToken = new RefreshToken(user.Id, "expired_token", DateTimeOffset.UtcNow.AddMinutes(-10), "127.0.0.1");
        _context.RefreshTokens.Add(expiredToken);
        await _context.SaveChangesAsync();

        var command = new RefreshTokenCommand("expired_token");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.RefreshTokenExpired");
    }

    [Fact]
    public async Task Handle_WithRevokedToken_ShouldRevokeAllUserTokensAndReturnTokenReuseDetected()
    {
        var user = User.Create("charlie@example.com", "charlie", "hash", null);
        _context.Users.Add(user);

        var compromisedToken = new RefreshToken(user.Id, "stolen_token", DateTimeOffset.UtcNow.AddDays(7), "127.0.0.1");
        compromisedToken.Revoke("127.0.0.1", "replacement_token");
        _context.RefreshTokens.Add(compromisedToken);

        var otherActiveSession = new RefreshToken(user.Id, "legitimate_active_session", DateTimeOffset.UtcNow.AddDays(7), "127.0.0.1");
        _context.RefreshTokens.Add(otherActiveSession);
        await _context.SaveChangesAsync();

        var command = new RefreshTokenCommand("stolen_token");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.TokenReuseDetected");

        otherActiveSession.IsRevoked.Should().BeTrue();
    }
}
