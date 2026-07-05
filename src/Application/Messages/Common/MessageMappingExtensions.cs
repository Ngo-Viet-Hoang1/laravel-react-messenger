using MessengerApp.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace MessengerApp.Application.Messages.Common;

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class MessageMappingExtensions
{
    public static MessageDto ToDto(this Message message, User sender) =>
        new(
            message.Id,
            message.ChannelId,
            message.SenderId,
            sender.Username,
            sender.AvatarUrl,
            message.Content,
            message.ClientMessageId,
            message.CreatedAt,
            MapReactions(message.Reactions));

    [MapProperty("Sender.Username", nameof(MessageDto.SenderUsername))]
    [MapProperty("Sender.AvatarUrl", nameof(MessageDto.SenderAvatarUrl))]
    [MapProperty(nameof(Message.Reactions), nameof(MessageDto.Reactions), Use = nameof(MapReactions))]
    public static partial MessageDto ToDto(this Message message);

    public static List<ReactionGroupDto> MapReactions(ICollection<MessageReaction>? reactions)
    {
        if (reactions == null || reactions.Count == 0)
        {
            return [];
        }

        return reactions
            .GroupBy(r => r.Emoji)
            .Select(g => new ReactionGroupDto(g.Key, g.Count(), g.Select(r => r.UserId).ToList()))
            .ToList();
    }
}
