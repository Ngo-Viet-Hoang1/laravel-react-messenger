namespace MessengerApp.Application.Common.Models;

/// <summary>
/// Encapsulates generic cursor-paginated data with cursor pointer and pagination metadata.
/// </summary>
/// <typeparam name="T">Type of items in the list.</typeparam>
public class CursorPagedList<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public DateTimeOffset? NextCursor { get; init; }
    public bool HasMore { get; init; }

    public CursorPagedList() { }

    public CursorPagedList(IReadOnlyList<T> items, DateTimeOffset? nextCursor, bool hasMore)
    {
        Items = items;
        NextCursor = nextCursor;
        HasMore = hasMore;
    }
}
