using FluentAssertions;
using MessengerApp.Application.Auth.Commands.Register;
using Xunit;

namespace MessengerApp.Application.UnitTests.Auth;

public class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_ShouldPass()
    {
        var command = new RegisterCommand("valid.email@example.com", "valid_user-1", "SecurePass123!");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    [InlineData("user@")]
    public void Validate_WithInvalidEmail_ShouldFail(string email)
    {
        var command = new RegisterCommand(email, "valid_user", "SecurePass123!");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterCommand.Email));
    }

    [Theory]
    [InlineData("ab")] 
    [InlineData("invalid user space")] 
    [InlineData("user@bad")] 
    public void Validate_WithInvalidUsername_ShouldFail(string username)
    {
        var command = new RegisterCommand("test@example.com", username, "SecurePass123!");

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterCommand.Username));
    }

    [Theory]
    [InlineData("short1!")] 
    [InlineData("nouppercase123!")] 
    [InlineData("NoDigitAtAll!")] 
    [InlineData("NoSpecialChar123")] 
    public void Validate_WithWeakPassword_ShouldFail(string password)
    {
        var command = new RegisterCommand("test@example.com", "validuser", password);

        var result = _validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterCommand.Password));
    }
}
