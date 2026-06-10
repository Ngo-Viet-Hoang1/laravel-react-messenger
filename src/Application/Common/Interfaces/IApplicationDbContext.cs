using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
