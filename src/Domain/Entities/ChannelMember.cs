using MessengerApp.Domain.Common;
using MessengerApp.Domain.Enums;

namespace MessengerApp.Domain.Entities;

public class ChannelMember : BaseAuditableEntity
{
    public Guid ChannelId { get; set; }
    public Guid UserId { get; set; }
    public ChannelMemberRole Role { get; set; } = ChannelMemberRole.Member;
    public DateTimeOffset? LastReadAt { get; set; }

    public Channel Channel { get; set; } = null!;
    public User User { get; set; } = null!;

    public ChannelMember() { }

    public ChannelMember(Guid channelId, Guid userId, ChannelMemberRole role = ChannelMemberRole.Member)
    {
        ChannelId = channelId;
        UserId = userId;
        Role = role;
    }

    public void MarkAsRead(DateTimeOffset? readTimestamp = null)
    {
        LastReadAt = readTimestamp ?? DateTimeOffset.UtcNow;
    }

    public void UpdateRole(ChannelMemberRole newRole)
    {
        Role = newRole;
    }
}
