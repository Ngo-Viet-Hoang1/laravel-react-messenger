namespace MessengerApp.Application.Messages.Common;

public record ReactionGroupDto(
    string Emoji,
    int Count,
    List<Guid> UserIds
);
