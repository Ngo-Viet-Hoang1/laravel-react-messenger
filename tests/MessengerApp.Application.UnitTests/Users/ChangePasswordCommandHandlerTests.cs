using FluentAssertions;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Application.Users.Commands.ChangePassword;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using NSubstitute;
using Xunit;

namespace MessengerApp.Application.UnitTests.Users;

public class ChangePasswordCommandHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly ChangePasswordCommandHandler _handler;

    public ChangePasswordCommandHandlerTests()
    {
        _handler = new ChangePasswordCommandHandler(_context, _passwordHasher);
    }

    [Fact]
    public async Task Handle_WhenValidCurrentPassword_ShouldUpdatePasswordHashAndSucceed()
    {
        User user = User.Create("user@test.com", "username", "old_hash");
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _passwordHasher.VerifyPassword("CurrentPass123!", "old_hash").Returns(true);
        _passwordHasher.HashPassword("NewPass123!").Returns("new_hash");

        ChangePasswordCommand command = new(user.Id, "CurrentPass123!", "NewPass123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();

        User updated = await _context.Users.FindAsync(user.Id);
        updated!.PasswordHash.Should().Be("new_hash");
    }

    [Fact]
    public async Task Handle_WhenCurrentPasswordMismatch_ShouldReturnValidationError()
    {
        User user = User.Create("user@test.com", "username", "old_hash");
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _passwordHasher.VerifyPassword("WrongPass!", "old_hash").Returns(false);

        ChangePasswordCommand command = new(user.Id, "WrongPass!", "NewPass123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be("User.InvalidCurrentPassword");
    }

    [Fact]
    public async Task Handle_WhenUserNotFound_ShouldReturnNotFound()
    {
        ChangePasswordCommand command = new(Guid.NewGuid(), "CurrentPass123!", "NewPass123!");

        var result = await _handler.Handle(command, CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Error.Type.Should().Be(ErrorType.NotFound);
    }
}
