using FluentAssertions;
using MessengerApp.Application.Auth.Commands.Login;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Auth;

public class LoginCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtTokenService _jwtTokenService = Substitute.For<IJwtTokenService>();
    private readonly IClientInfoProvider _clientInfoProvider = Substitute.For<IClientInfoProvider>();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _clientInfoProvider.ClientIpAddress.Returns("127.0.0.1");
        _jwtTokenService.GenerateAccessToken(Arg.Any<User>()).Returns("mock_access_token");
        _jwtTokenService.GenerateRefreshToken(Arg.Any<Guid>(), Arg.Any<string>())
            .Returns(callInfo => new RefreshToken(callInfo.Arg<Guid>(), "mock_refresh_token", DateTimeOffset.UtcNow.AddDays(7), "127.0.0.1"));

        _handler = new LoginCommandHandler(_context, _passwordHasher, _jwtTokenService, _clientInfoProvider);
    }

    [Fact]
    public async Task Handle_WithValidCredentials_ShouldReturnTokens()
    {
        var user = User.Create("john@example.com", "johndoe", "hashed_password", null);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _passwordHasher.VerifyPassword("Password123!", "hashed_password").Returns(true);

        var command = new LoginCommand("john@example.com", "Password123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Email.Should().Be("john@example.com");
        result.Value.AccessToken.Should().Be("mock_access_token");
        result.Value.RefreshToken.Should().Be("mock_refresh_token");

        var tokenInDb = _context.RefreshTokens.FirstOrDefault(t => t.UserId == user.Id);
        tokenInDb.Should().NotBeNull();
        tokenInDb!.Token.Should().Be("mock_refresh_token");
    }

    [Fact]
    public async Task Handle_WithWrongPassword_ShouldReturnUnauthorized()
    {
        var user = User.Create("john@example.com", "johndoe", "hashed_password", null);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _passwordHasher.VerifyPassword("WrongPassword!", "hashed_password").Returns(false);

        var command = new LoginCommand("john@example.com", "WrongPassword!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.InvalidCredentials");
    }

    [Fact]
    public async Task Handle_WithNonExistentUser_ShouldReturnUnauthorized()
    {
        var command = new LoginCommand("ghost@example.com", "Password123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.InvalidCredentials");
    }
}
