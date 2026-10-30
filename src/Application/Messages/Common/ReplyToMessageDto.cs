namespace MessengerApp.Application.Messages.Common;

public record ReplyToMessageDto(
    Guid Id,
    Guid SenderId,
    string SenderUsername,
    string Content
);
