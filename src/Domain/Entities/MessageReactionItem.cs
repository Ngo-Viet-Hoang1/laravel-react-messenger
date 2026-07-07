namespace MessengerApp.Domain.Entities;

public class MessageReactionItem
{
    public string Emoji { get; set; } = string.Empty;
    public int Count { get; set; }
    public List<Guid> UserIds { get; set; } = [];

    public MessageReactionItem() { }

    public MessageReactionItem(string emoji, int count, List<Guid> userIds)
    {
        Emoji = emoji;
        Count = count;
        UserIds = userIds;
    }
}
