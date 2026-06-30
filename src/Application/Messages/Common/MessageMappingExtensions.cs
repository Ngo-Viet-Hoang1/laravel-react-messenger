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
            message.CreatedAt);

    [MapProperty("Sender.Username", nameof(MessageDto.SenderUsername))]
    [MapProperty("Sender.AvatarUrl", nameof(MessageDto.SenderAvatarUrl))]
    public static partial MessageDto ToDto(this Message message);
}
