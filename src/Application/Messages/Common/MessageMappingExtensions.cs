using MessengerApp.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace MessengerApp.Application.Messages.Common;

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class MessageMappingExtensions
{
    public static MessageDto ToDto(this Message message, User sender, Message? parentMessage = null) =>
        new(
            message.Id,
            message.ChannelId,
            message.SenderId,
            sender.Username,
            sender.AvatarUrl,
            message.Content,
            message.ClientMessageId,
            message.CreatedAt,
            MapReactions(message.Reactions),
            MapReplyTo(parentMessage ?? message.ParentMessage));

    [MapProperty("Sender.Username", nameof(MessageDto.SenderUsername))]
    [MapProperty("Sender.AvatarUrl", nameof(MessageDto.SenderAvatarUrl))]
    [MapProperty(nameof(Message.Reactions), nameof(MessageDto.Reactions), Use = nameof(MapReactions))]
    [MapProperty(nameof(Message.ParentMessage), nameof(MessageDto.ReplyTo), Use = nameof(MapReplyTo))]
    public static partial MessageDto ToDto(this Message message);

    public static ReplyToMessageDto? MapReplyTo(Message? parentMessage)
    {
        if (parentMessage == null) return null;

        string username = parentMessage.Sender?.Username ?? "Unknown";
        string content = parentMessage.IsDeleted ? "This message was deleted" : parentMessage.Content;

        return new ReplyToMessageDto(
            parentMessage.Id,
            parentMessage.SenderId,
            username,
            content
        );
    }

    public static List<ReactionGroupDto> MapReactions(IEnumerable<MessageReactionItem>? reactions)
    {
        if (reactions == null)
        {
            return [];
        }

        return reactions
            .Select(r => new ReactionGroupDto(r.Emoji, r.Count, r.UserIds))
            .ToList();
    }
}
