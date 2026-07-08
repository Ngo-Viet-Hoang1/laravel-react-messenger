namespace MessengerApp.Application.Messages.Common;

public record MessageDto(
    Guid Id,
    Guid ChannelId,
    Guid SenderId,
    string SenderUsername,
    string? SenderAvatarUrl,
    string Content,
    string? ClientMessageId,
    DateTimeOffset CreatedAt,
    List<ReactionGroupDto>? Reactions = null,
    ReplyToMessageDto? ReplyTo = null
);
