using MessengerApp.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace MessengerApp.Application.Auth.Common;

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class AuthMappingExtensions
{
    public static partial UserDto ToDto(this User user);
}
