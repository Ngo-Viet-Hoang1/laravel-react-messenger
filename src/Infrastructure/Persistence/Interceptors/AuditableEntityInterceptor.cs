using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Common.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace MessengerApp.Infrastructure.Persistence.Interceptors;

public class AuditableEntityInterceptor(
    TimeProvider? timeProvider = null,
    ICurrentUserService? currentUserService = null)
    : SaveChangesInterceptor
{
    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;
    private readonly ICurrentUserService? _currentUserService = currentUserService;

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateEntities(DbContext? context)
    {
        if (context is null) return;

        var utcNow = _timeProvider.GetUtcNow();
        var userId = _currentUserService?.UserId;

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity is BaseEntity baseEntity && baseEntity.Id == Guid.Empty)
                {
                    baseEntity.Id = Guid.NewGuid();
                }

                if (entry.Entity is IDateTracking dateTracking)
                {
                    dateTracking.CreatedAt = utcNow;
                    dateTracking.LastModifiedAt = null;
                }

                if (entry.Entity is IUserTracking userTracking && !string.IsNullOrWhiteSpace(userId))
                {
                    userTracking.CreatedBy = userId;
                    userTracking.LastModifiedBy = null;
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                if (entry.Entity is IDateTracking dateTracking)
                {
                    dateTracking.LastModifiedAt = utcNow;
                }

                if (entry.Entity is IUserTracking userTracking && !string.IsNullOrWhiteSpace(userId))
                {
                    userTracking.LastModifiedBy = userId;
                }
            }
            else if (entry.State == EntityState.Deleted)
            {
                if (entry.Entity is ISoftDelete softDelete)
                {
                    entry.State = EntityState.Modified;
                    softDelete.IsDeleted = true;
                    softDelete.DeletedAt = utcNow;
                    softDelete.DeletedBy = userId;

                    if (entry.Entity is IDateTracking dateTracking)
                    {
                        dateTracking.LastModifiedAt = utcNow;
                    }

                    if (entry.Entity is IUserTracking userTracking && !string.IsNullOrWhiteSpace(userId))
                    {
                        userTracking.LastModifiedBy = userId;
                    }
                }
            }
        }
    }
}
