using MessengerApp.Domain.Enums;

namespace MessengerApp.Application.Channels.Common;

public record ChannelSummaryDto(
    Guid Id,
    string Name,
    ChannelType Type,
    string? AvatarUrl,
    DateTimeOffset? LastReadAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastActivityAt,
    bool HasUnread = false,
    int UnreadCount = 0,
    Guid? OtherUserId = null
);

public record ChannelDetailDto(
    Guid Id,
    string Name,
    string? Description,
    ChannelType Type,
    string? AvatarUrl,
    int MemberCount,
    DateTimeOffset CreatedAt,
    Guid? CreatorId = null
);

public record ChannelMemberDto(
    Guid UserId,
    string Username,
    string? AvatarUrl,
    ChannelMemberRole Role,
    DateTimeOffset? LastReadAt
);
