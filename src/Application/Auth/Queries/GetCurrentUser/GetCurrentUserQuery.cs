using MediatR;
using MessengerApp.Application.Auth.Common;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;

namespace MessengerApp.Application.Auth.Queries.GetCurrentUser;

public record GetCurrentUserQuery(Guid UserId) : IRequest<Result<CurrentUserResponse>>;

public class GetCurrentUserQueryHandler(IApplicationDbContext context) : IRequestHandler<GetCurrentUserQuery, Result<CurrentUserResponse>>
{
    public async Task<Result<CurrentUserResponse>> Handle(GetCurrentUserQuery query, CancellationToken ct)
    {
        if (query.UserId == Guid.Empty)
        {
            return Result.Failure<CurrentUserResponse>(
                Error.Unauthorized("User.Unauthorized", "User identity could not be verified."));
        }

        var user = await context.Users.FindAsync([query.UserId], ct);

        if (user == null || user.IsDeleted)
        {
            return Result.Failure<CurrentUserResponse>(
                Error.NotFound("User.NotFound", "User not found."));
        }

        return Result.Success(new CurrentUserResponse(
            user.Id,
            user.Email,
            user.Username,
            user.AvatarUrl,
            user.CreatedAt,
            user.LastSeenAt));
    }
}
