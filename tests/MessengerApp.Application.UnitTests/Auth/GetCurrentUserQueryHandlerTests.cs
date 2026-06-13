using FluentAssertions;
using MessengerApp.Application.Auth.Queries.GetCurrentUser;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Domain.Entities;
using Xunit;

namespace MessengerApp.Application.UnitTests.Auth;

public class GetCurrentUserQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly GetCurrentUserQueryHandler _handler;

    public GetCurrentUserQueryHandlerTests()
    {
        _handler = new GetCurrentUserQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WithValidUserId_ShouldReturnCurrentUser()
    {
        // Arrange
        var user = User.Create("me@example.com", "meuser", "hash", "https://avatar.com/me.png");
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var query = new GetCurrentUserQuery(user.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Id.Should().Be(user.Id);
        result.Value.Email.Should().Be("me@example.com");
        result.Value.Username.Should().Be("meuser");
        result.Value.AvatarUrl.Should().Be("https://avatar.com/me.png");
    }

    [Fact]
    public async Task Handle_WithEmptyUserId_ShouldReturnUnauthorized()
    {
        // Arrange
        var query = new GetCurrentUserQuery(Guid.Empty);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("User.Unauthorized");
    }

    [Fact]
    public async Task Handle_WithNonExistentUser_ShouldReturnNotFound()
    {
        // Arrange
        var query = new GetCurrentUserQuery(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("User.NotFound");
    }
}
