using FluentAssertions;
using MessengerApp.Application.Auth.Commands.Register;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Auth;

public class RegisterCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtTokenService _jwtTokenService = Substitute.For<IJwtTokenService>();
    private readonly IClientInfoProvider _clientInfoProvider = Substitute.For<IClientInfoProvider>();
    private readonly RegisterCommandHandler _handler;

    public RegisterCommandHandlerTests()
    {
        _clientInfoProvider.ClientIpAddress.Returns("127.0.0.1");
        _passwordHasher.HashPassword(Arg.Any<string>()).Returns("hashed_password");
        _jwtTokenService.GenerateAccessToken(Arg.Any<User>()).Returns("mock_access_token");
        _jwtTokenService.GenerateRefreshToken(Arg.Any<Guid>(), Arg.Any<string>())
            .Returns(callInfo => new RefreshToken(callInfo.Arg<Guid>(), "mock_refresh_token", DateTimeOffset.UtcNow.AddDays(7), "127.0.0.1"));

        _handler = new RegisterCommandHandler(_context, _passwordHasher, _jwtTokenService, _clientInfoProvider);
    }

    [Fact]
    public async Task Handle_WithValidCommand_ShouldCreateUserAndReturnTokens()
    {
        var command = new RegisterCommand("newuser@example.com", "newuser", "Password123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.User.Email.Should().Be("newuser@example.com");
        result.Value.User.Username.Should().Be("newuser");
        result.Value.AccessToken.Should().Be("mock_access_token");
        result.Value.RefreshToken.Should().Be("mock_refresh_token");

        var userInDb = _context.Users.FirstOrDefault(u => u.Email == "newuser@example.com");
        userInDb.Should().NotBeNull();
        userInDb!.PasswordHash.Should().Be("hashed_password");
    }

    [Fact]
    public async Task Handle_WithExistingEmail_ShouldReturnConflict()
    {
        var existingUser = User.Create("existing@example.com", "user1", "hash", null);
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var command = new RegisterCommand("existing@example.com", "user2", "Password123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("User.EmailConflict");
    }

    [Fact]
    public async Task Handle_WithExistingUsername_ShouldReturnConflict()
    {
        var existingUser = User.Create("user1@example.com", "existinguser", "hash", null);
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var command = new RegisterCommand("user2@example.com", "existinguser", "Password123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("User.UsernameConflict");
    }
}
