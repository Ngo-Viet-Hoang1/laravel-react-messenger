namespace MessengerApp.Application.Messages.Common;

public record MessageContextDto(
    List<MessageDto> Messages,
    Guid TargetMessageId,
    bool HasOlder,
    bool HasNewer,
    DateTimeOffset? OldestCursor,
    DateTimeOffset? NewestCursor
);

