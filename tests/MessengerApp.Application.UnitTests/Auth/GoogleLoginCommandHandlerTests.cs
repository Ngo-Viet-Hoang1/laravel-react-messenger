using FluentAssertions;
using MessengerApp.Application.Auth.Commands.GoogleLogin;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Auth;

public class GoogleLoginCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IGoogleAuthService _googleAuthService = Substitute.For<IGoogleAuthService>();
    private readonly IJwtTokenService _jwtTokenService = Substitute.For<IJwtTokenService>();
    private readonly IClientInfoProvider _clientInfoProvider = Substitute.For<IClientInfoProvider>();
    private readonly GoogleLoginCommandHandler _handler;

    public GoogleLoginCommandHandlerTests()
    {
        _clientInfoProvider.ClientIpAddress.Returns("127.0.0.1");
        _jwtTokenService.GenerateAccessToken(Arg.Any<User>()).Returns("mock_access_token");
        _jwtTokenService.GenerateRefreshToken(Arg.Any<Guid>(), Arg.Any<string>())
            .Returns(callInfo => new RefreshToken(callInfo.Arg<Guid>(), "mock_refresh_token", DateTimeOffset.UtcNow.AddDays(7), "127.0.0.1"));

        _handler = new GoogleLoginCommandHandler(_context, _googleAuthService, _jwtTokenService, _clientInfoProvider);
    }

    [Fact]
    public async Task Handle_WithValidGooglePayload_ShouldDeriveUsernameFromEmail()
    {
        var googlePayload = new GoogleUserPayload(
            "hoang.ngo@example.com",
            "Ngô Việt Hoàng",
            "https://avatar.com/hoang.png",
            "google_sub_123");

        _googleAuthService.ValidateIdTokenAsync("valid_token", Arg.Any<CancellationToken>())
            .Returns(Result.Success(googlePayload));

        var command = new GoogleLoginCommand("valid_token");
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.User.Email.Should().Be("hoang.ngo@example.com");
        result.Value.User.Username.Should().Be("hoang.ngo");

        var userInDb = _context.Users.FirstOrDefault(u => u.Email == "hoang.ngo@example.com");
        userInDb.Should().NotBeNull();
        userInDb!.Username.Should().Be("hoang.ngo");
        userInDb.AvatarUrl.Should().Be("https://avatar.com/hoang.png");
    }

    [Fact]
    public async Task Handle_WithExistingUserHavingCorruptedUsername_ShouldAutoHealUsername()
    {
        var existingUser = User.Create("hoang.ngo@example.com", "Ng___Vi_t_Ho_ng", "EXTERNAL_HASH", null);
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var googlePayload = new GoogleUserPayload(
            "hoang.ngo@example.com",
            "Ngô Việt Hoàng",
            "https://avatar.com/hoang.png",
            "google_sub_123");

        _googleAuthService.ValidateIdTokenAsync("valid_token", Arg.Any<CancellationToken>())
            .Returns(Result.Success(googlePayload));

        var command = new GoogleLoginCommand("valid_token");
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.User.Username.Should().Be("hoang.ngo");

        var userInDb = _context.Users.First(u => u.Id == existingUser.Id);
        userInDb.Username.Should().Be("hoang.ngo");
    }

    [Fact]
    public async Task Handle_WithInvalidToken_ShouldReturnFailure()
    {
        _googleAuthService.ValidateIdTokenAsync("invalid_token", Arg.Any<CancellationToken>())
            .Returns(Result.Failure<GoogleUserPayload>(Error.Unauthorized("Auth.GoogleTokenInvalid", "Invalid token.")));

        var command = new GoogleLoginCommand("invalid_token");
        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Auth.GoogleTokenInvalid");
    }
}
