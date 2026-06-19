using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Application.Common.Mappings;
using MessengerApp.Application.Common.Models;
using MessengerApp.Domain.Common;
using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MessengerApp.Application.Users.Queries.SearchUsers;

public record SearchUsersQuery(
    Guid CurrentUserId,
    string? Search = null,
    PaginationParams? Pagination = null
) : IRequest<Result<PaginatedList<UserDto>>>
{
    public PaginationParams Pagination { get; init; } = Pagination ?? new();
}

public class SearchUsersQueryHandler(IApplicationDbContext context)
    : IRequestHandler<SearchUsersQuery, Result<PaginatedList<UserDto>>>
{
    public async Task<Result<PaginatedList<UserDto>>> Handle(SearchUsersQuery query, CancellationToken ct)
    {
        IQueryable<User> queryable = context.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted && u.Id != query.CurrentUserId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            string term = query.Search.Trim().ToLower();
            queryable = queryable.Where(u =>
                u.Username.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term));
        }

        PaginatedList<UserDto> paginatedUsers = await queryable
            .OrderBy(u => u.Username)
            .Select(u => new UserDto(u.Id, u.Email, u.Username, u.AvatarUrl))
            .ToPaginatedListAsync(query.Pagination.PageNumber, query.Pagination.PageSize, ct);

        return Result.Success(paginatedUsers);
    }
}
