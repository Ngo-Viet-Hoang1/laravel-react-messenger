namespace MessengerApp.WebAPI.Contracts.Channels;

public record AddChannelMembersRequest(List<Guid> MemberIds);
