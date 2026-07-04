using FluentAssertions;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Application.Users.Commands.UpdateProfile;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Xunit;

namespace MessengerApp.Application.UnitTests.Users;

public class UpdateProfileCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly UpdateProfileCommandHandler _handler;

    public UpdateProfileCommandHandlerTests()
    {
        _handler = new UpdateProfileCommandHandler(_context);
    }

    [Fact]
    public async Task Handle_WhenValidProfile_ShouldUpdateUsernameAndAvatar()
    {
        User user = User.Create("test@example.com", "oldname", "hash", "https://old.png");
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        UpdateProfileCommand command = new(user.Id, "newname", "https://new.png");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Username.Should().Be("newname");
        result.Value.AvatarUrl.Should().Be("https://new.png");

        User updated = await _context.Users.FindAsync(user.Id);
        updated!.Username.Should().Be("newname");
        updated.AvatarUrl.Should().Be("https://new.png");
    }

    [Fact]
    public async Task Handle_WhenUsernameTakenByAnotherUser_ShouldReturnConflict()
    {
        User user1 = User.Create("user1@example.com", "user1", "hash");
        User user2 = User.Create("user2@example.com", "user2", "hash");
        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        UpdateProfileCommand command = new(user1.Id, "user2", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Type.Should().Be(ErrorType.Conflict);
        result.Error.Code.Should().Be("User.UsernameTaken");
    }

    [Fact]
    public async Task Handle_WhenKeepingSameUsernameCaseInsensitive_ShouldSucceed()
    {
        User user = User.Create("user@example.com", "OriginalName", "hash");
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        UpdateProfileCommand command = new(user.Id, "originalname", "https://avatar.png");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Username.Should().Be("originalname");
    }

    [Fact]
    public async Task Handle_WhenUserDoesNotExist_ShouldReturnNotFound()
    {
        UpdateProfileCommand command = new(Guid.NewGuid(), "nonexistent", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Type.Should().Be(ErrorType.NotFound);
    }
}
