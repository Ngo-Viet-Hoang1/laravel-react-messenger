using MessengerApp.Domain.Entities;
using MessengerApp.Domain.Enums;

namespace MessengerApp.Application.Channels.Common;

public static class ChannelMappingExtensions
{
    public static ChannelSummaryDto ToSummaryDto(this Channel channel, Guid currentUserId, int unreadCount = 0)
    {
        string displayName = channel.Name ?? string.Empty;
        string? displayAvatar = channel.AvatarUrl;
        DateTimeOffset? lastReadAt = null;
        Guid? otherUserId = null;

        if (channel.Type == ChannelType.Direct)
        {
            ChannelMember? otherMember = channel.Members.FirstOrDefault(m => m.UserId != currentUserId);
            if (otherMember != null)
            {
                otherUserId = otherMember.UserId;
                if (otherMember.User != null)
                {
                    displayName = otherMember.User.Username;
                    displayAvatar = otherMember.User.AvatarUrl;
                }
            }
        }

        ChannelMember? currentMember = channel.Members.FirstOrDefault(m => m.UserId == currentUserId);
        if (currentMember != null)
        {
            lastReadAt = currentMember.LastReadAt;
        }

        DateTimeOffset? lastActivityAt = channel.LastModifiedAt;
        bool hasUnread = unreadCount > 0;

        return new ChannelSummaryDto(
            channel.Id,
            displayName,
            channel.Type,
            displayAvatar,
            lastReadAt,
            channel.CreatedAt,
            lastActivityAt,
            hasUnread,
            unreadCount,
            otherUserId
        );
    }

    public static ChannelDetailDto ToDetailDto(this Channel channel, Guid currentUserId)
    {
        string displayName = channel.Name ?? string.Empty;
        string? displayAvatar = channel.AvatarUrl;

        if (channel.Type == ChannelType.Direct)
        {
            User? otherUser = channel.Members.FirstOrDefault(m => m.UserId != currentUserId)?.User;
            if (otherUser != null)
            {
                displayName = otherUser.Username;
                displayAvatar = otherUser.AvatarUrl;
            }
        }

        Guid? creatorId = channel.Members.FirstOrDefault(m => m.Role == ChannelMemberRole.Owner)?.UserId;

        return new ChannelDetailDto(
            channel.Id,
            displayName,
            channel.Description,
            channel.Type,
            displayAvatar,
            channel.Members.Count,
            channel.CreatedAt,
            creatorId
        );
    }

    public static ChannelMemberDto ToMemberDto(this ChannelMember member)
    {
        return new ChannelMemberDto(
            member.UserId,
            member.User?.Username ?? string.Empty,
            member.User?.AvatarUrl,
            member.Role,
            member.LastReadAt
        );
    }
}
