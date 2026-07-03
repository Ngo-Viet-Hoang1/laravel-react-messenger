using MessengerApp.Domain.Common;
using MessengerApp.Domain.Common.Contracts;
using MessengerApp.Domain.Enums;

namespace MessengerApp.Domain.Entities;

public class Channel : BaseAuditableEntity, ISoftDelete
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public ChannelType Type { get; set; }
    public string? AvatarUrl { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }

    private readonly List<ChannelMember> _members = [];
    public IReadOnlyCollection<ChannelMember> Members => _members.AsReadOnly();

    public Channel() { }

    private Channel(ChannelType type, string? name, string? description = null, string? avatarUrl = null)
    {
        Type = type;
        Name = name?.Trim();
        Description = description?.Trim();
        AvatarUrl = avatarUrl?.Trim();
        IsDeleted = false;
    }

    public static Channel CreateGroup(string name, Guid creatorId, string? description = null, string? avatarUrl = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        Channel channel = new(ChannelType.Group, name, description, avatarUrl);
        channel.AddMember(creatorId, ChannelMemberRole.Owner);
        return channel;
    }

    public static Channel CreateDirect(Guid userAId, Guid userBId)
    {
        if (userAId == userBId)
        {
            throw new InvalidOperationException("Direct channel cannot be created with only one user.");
        }

        Channel channel = new(ChannelType.Direct, name: null);
        channel.AddMember(userAId, ChannelMemberRole.Member);
        channel.AddMember(userBId, ChannelMemberRole.Member);
        return channel;
    }

    public ChannelMember? AddMember(Guid userId, ChannelMemberRole role = ChannelMemberRole.Member)
    {
        if (_members.Any(m => m.UserId == userId))
        {
            return null;
        }

        ChannelMember member = new()
        {
            ChannelId = Id,
            UserId = userId,
            Role = role,
            LastReadAt = DateTimeOffset.UtcNow
        };

        _members.Add(member);
        return member;
    }

    public void RemoveMember(Guid userId)
    {
        ChannelMember? member = _members.FirstOrDefault(m => m.UserId == userId);
        if (member != null)
        {
            _members.Remove(member);
        }
    }

    public void UpdateDetails(string name, string? description, string? avatarUrl)
    {
        if (Type == ChannelType.Group)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(name);
            Name = name.Trim();
        }

        Description = description?.Trim();
        AvatarUrl = avatarUrl?.Trim();
    }
}
