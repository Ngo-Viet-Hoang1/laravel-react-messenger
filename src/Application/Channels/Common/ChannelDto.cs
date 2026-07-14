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
    Guid? OtherUserId = null,
    bool IsSecret = false,
    string? EncryptionSalt = null
);

public record ChannelDetailDto(
    Guid Id,
    string Name,
    string? Description,
    ChannelType Type,
    string? AvatarUrl,
    int MemberCount,
    DateTimeOffset CreatedAt,
    Guid? CreatorId = null,
    bool IsSecret = false,
    string? EncryptionSalt = null,
    Guid? OtherUserId = null
);

public record ChannelMemberDto(
    Guid UserId,
    string Username,
    string Email,
    string? AvatarUrl,
    ChannelMemberRole Role,
    DateTimeOffset? LastReadAt,
    DateTimeOffset JoinedAt
);
