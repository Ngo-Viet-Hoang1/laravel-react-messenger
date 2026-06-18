namespace MessengerApp.WebAPI.Contracts.Channels;

public record CreateChannelRequest(
    string Name,
    string? Description = null,
    string? AvatarUrl = null,
    List<Guid>? MemberIds = null
);
