namespace MessengerApp.Application.Common.Models;

/// <summary>
/// Encapsulates standard cursor or offset pagination parameters following Clean Architecture standards.
/// Clamps PageSize between 1 and MaxPageSize to prevent database exhaustion.
/// </summary>
public record PaginationParams(int PageNumber = 1, int PageSize = 20)
{
    public const int MaxPageSize = 50;
    public const int DefaultPageSize = 20;

    public int PageNumber { get; init; } = PageNumber < 1 ? 1 : PageNumber;
    public int PageSize { get; init; } = Math.Clamp(PageSize, 1, MaxPageSize);
}
