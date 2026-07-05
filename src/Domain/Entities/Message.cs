using MessengerApp.Domain.Common;
using MessengerApp.Domain.Common.Contracts;

namespace MessengerApp.Domain.Entities;

public class Message : BaseAuditableEntity, ISoftDelete
{
    public Guid ChannelId { get; set; }
    public Channel Channel { get; set; } = null!;

    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;

    public string Content { get; set; } = string.Empty;
    public string? ClientMessageId { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }

    public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();

    public Message() { }

    private Message(Guid channelId, Guid senderId, string content, string? clientMessageId = null)
    {
        ChannelId = channelId;
        SenderId = senderId;
        Content = content;
        ClientMessageId = clientMessageId;
        IsDeleted = false;
    }

    public static Message Create(Guid channelId, Guid senderId, string content, string? clientMessageId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);
        if (channelId == Guid.Empty) throw new ArgumentException("ChannelId cannot be empty.", nameof(channelId));
        if (senderId == Guid.Empty) throw new ArgumentException("SenderId cannot be empty.", nameof(senderId));

        return new Message(channelId, senderId, content.Trim(), clientMessageId?.Trim());
    }
}
