using MessengerApp.Domain.Common;

namespace MessengerApp.Domain.Entities;

public class MessageReaction : BaseEntity
{
    public Guid MessageId { get; set; }
    public Message Message { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Emoji { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public MessageReaction() { }

    private MessageReaction(Guid messageId, Guid userId, string emoji)
    {
        MessageId = messageId;
        UserId = userId;
        Emoji = emoji;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public static MessageReaction Create(Guid messageId, Guid userId, string emoji)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(emoji);
        if (messageId == Guid.Empty) throw new ArgumentException("MessageId cannot be empty.", nameof(messageId));
        if (userId == Guid.Empty) throw new ArgumentException("UserId cannot be empty.", nameof(userId));

        return new MessageReaction(messageId, userId, emoji.Trim());
    }
}
