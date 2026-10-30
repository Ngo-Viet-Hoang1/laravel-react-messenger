using MessengerApp.Application.Attachments.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace MessengerApp.Application.Messages.Common;

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class MessageMappingExtensions
{
    public static MessageDto ToDto(
        this Message message,
        User sender,
        IObjectStorageService storage,
        Message? parentMessage = null,
        IEnumerable<MessageAttachment>? attachments = null,
        TimeSpan? expiry = null)
    {
        var attachmentDtos = attachments != null
            ? attachments.Where(a => a.IsUploadCompleted).ToDtoList(storage, expiry)
            : null;

        return new MessageDto(
            message.Id,
            message.ChannelId,
            message.SenderId,
            sender.Username,
            sender.AvatarUrl,
            message.Content,
            message.ClientMessageId,
            message.CreatedAt,
            MapReactions(message.Reactions),
            MapReplyTo(parentMessage),
            attachmentDtos);
    }

    [MapProperty("Sender.Username", nameof(MessageDto.SenderUsername))]
    [MapProperty("Sender.AvatarUrl", nameof(MessageDto.SenderAvatarUrl))]
    [MapProperty(nameof(Message.Reactions), nameof(MessageDto.Reactions), Use = nameof(MapReactions))]
    [MapProperty(nameof(Message.ParentMessage), nameof(MessageDto.ReplyTo), Use = nameof(MapReplyTo))]
    [MapperIgnoreSource(nameof(Message.Attachments))]
    [MapperIgnoreTarget(nameof(MessageDto.Attachments))]
    public static partial MessageDto ToDto(this Message message);

    public static MessageDto ToDto(
        this Message message,
        IObjectStorageService storage,
        TimeSpan? expiry = null)
    {
        var dto = message.ToDto();
        var attachments = message.Attachments != null && message.Attachments.Count > 0
            ? message.Attachments.Where(a => a.IsUploadCompleted).ToDtoList(storage, expiry)
            : null;

        return dto with { Attachments = attachments };
    }

    public static ReplyToMessageDto? MapReplyTo(Message? parentMessage)
    {
        if (parentMessage == null) return null;

        return new ReplyToMessageDto(
            parentMessage.Id,
            parentMessage.SenderId,
            parentMessage.Sender?.Username ?? "Unknown",
            GetReplyPreviewContent(parentMessage)
        );
    }

    private static string GetReplyPreviewContent(Message parent)
    {
        if (parent.IsDeleted) return "This message was deleted";
        if (!string.IsNullOrWhiteSpace(parent.Content)) return parent.Content;

        var firstAttachment = parent.Attachments?.FirstOrDefault();
        if (firstAttachment == null) return "[Attachment]";

        return firstAttachment.ContentType switch
        {
            var ct when ct.StartsWith("image/", StringComparison.OrdinalIgnoreCase) => "[Photo]",
            var ct when ct.StartsWith("video/", StringComparison.OrdinalIgnoreCase) => "[Video]",
            var ct when ct.StartsWith("audio/", StringComparison.OrdinalIgnoreCase) => "[Audio]",
            _ => "[Attachment]"
        };
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
