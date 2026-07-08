namespace MessengerApp.WebAPI.Contracts.Messages;

public record SendMessageRequest(
    string Content,
    string? ClientMessageId = null,
    Guid? ParentMessageId = null
);
