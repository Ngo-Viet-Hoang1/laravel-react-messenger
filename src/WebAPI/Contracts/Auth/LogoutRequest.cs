namespace MessengerApp.WebAPI.Contracts.Auth;

public record LogoutRequest(string? RefreshToken = null);
