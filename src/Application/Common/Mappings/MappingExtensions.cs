using MessengerApp.Application.Common.Models;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Common.Mappings;

/// <summary>
/// Extension methods for IQueryable to streamline PaginatedList creation directly from LINQ queries.
/// </summary>
public static class MappingExtensions
{
    public static Task<PaginatedList<TDestination>> ToPaginatedListAsync<TDestination>(
        this IQueryable<TDestination> queryable,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
        where TDestination : class
        => PaginatedList<TDestination>.CreateAsync(queryable.AsNoTracking(), pageNumber, pageSize, cancellationToken);
}
