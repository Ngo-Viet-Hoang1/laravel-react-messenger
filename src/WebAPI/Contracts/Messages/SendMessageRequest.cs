namespace MessengerApp.WebAPI.Contracts.Messages;

public record SendMessageRequest(
    string? Content = null,
    string? ClientMessageId = null,
    Guid? ParentMessageId = null,
    List<Guid>? AttachmentIds = null
);
