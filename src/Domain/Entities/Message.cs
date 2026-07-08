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

    public Guid? ParentMessageId { get; set; }
    public Message? ParentMessage { get; set; }

    public List<MessageReactionItem> Reactions { get; set; } = [];

    public Message() { }

    private Message(Guid channelId, Guid senderId, string content, string? clientMessageId = null, Guid? parentMessageId = null)
    {
        ChannelId = channelId;
        SenderId = senderId;
        Content = content;
        ClientMessageId = clientMessageId;
        ParentMessageId = parentMessageId;
        IsDeleted = false;
    }

    public static Message Create(Guid channelId, Guid senderId, string content, string? clientMessageId = null, Guid? parentMessageId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content);
        if (channelId == Guid.Empty) throw new ArgumentException("ChannelId cannot be empty.", nameof(channelId));
        if (senderId == Guid.Empty) throw new ArgumentException("SenderId cannot be empty.", nameof(senderId));

        return new Message(channelId, senderId, content.Trim(), clientMessageId?.Trim(), parentMessageId);
    }

    public bool ToggleReaction(Guid userId, string emoji)
    {
        var updatedList = Reactions.Select(r => new MessageReactionItem(r.Emoji, r.Count, [.. r.UserIds])).ToList();
        var group = updatedList.FirstOrDefault(r => r.Emoji == emoji);

        bool added;
        if (group != null)
        {
            if (group.UserIds.Contains(userId))
            {
                group.UserIds.Remove(userId);
                group.Count = group.UserIds.Count;

                if (group.Count <= 0)
                {
                    updatedList.Remove(group);
                }

                added = false;
            }
            else
            {
                group.UserIds.Add(userId);
                group.Count = group.UserIds.Count;
                added = true;
            }
        }
        else
        {
            updatedList.Add(new MessageReactionItem(emoji, 1, [userId]));
            added = true;
        }

        Reactions = updatedList;
        return added;
    }
}
