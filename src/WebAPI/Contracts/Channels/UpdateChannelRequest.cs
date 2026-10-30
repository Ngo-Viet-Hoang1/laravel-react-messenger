namespace MessengerApp.WebAPI.Contracts.Channels;

public record UpdateChannelRequest(
    string Name,
    string? Description = null,
    string? AvatarUrl = null
);
