using FluentAssertions;
using MessengerApp.Application.Common.Models;
using MessengerApp.Application.UnitTests.Common;
using MessengerApp.Application.Users.Queries.SearchUsers;
using MessengerApp.Domain.Entities;
using Xunit;

namespace MessengerApp.Application.UnitTests.Users;

public class SearchUsersQueryHandlerTests
{
    private readonly TestDbContext _context = TestDbContext.Create();
    private readonly SearchUsersQueryHandler _handler;

    public SearchUsersQueryHandlerTests()
    {
        _handler = new SearchUsersQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WhenSearchMatchesUsername_ShouldReturnMatchingPaginatedUsers()
    {
        User current = User.Create("me@example.com", "myuser", "pwd");
        User alice = User.Create("alice@work.com", "alice_w", "pwd");
        User bob = User.Create("bob@work.com", "bob_b", "pwd");
        _context.Users.AddRange(current, alice, bob);
        await _context.SaveChangesAsync();

        SearchUsersQuery query = new(current.Id, "alice");

        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(1);
        result.Value.TotalCount.Should().Be(1);
        result.Value.PageNumber.Should().Be(1);
        result.Value.Items[0].Username.Should().Be("alice_w");
    }

    [Fact]
    public async Task Handle_WhenSearchMatchesEmail_ShouldReturnMatchingPaginatedUsers()
    {
        User current = User.Create("me@example.com", "myuser", "pwd");
        User alice = User.Create("alice@work.com", "alice_w", "pwd");
        User bob = User.Create("bob@personal.com", "bob_b", "pwd");
        _context.Users.AddRange(current, alice, bob);
        await _context.SaveChangesAsync();

        SearchUsersQuery query = new(current.Id, "personal.com");

        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(1);
        result.Value.TotalCount.Should().Be(1);
        result.Value.Items[0].Username.Should().Be("bob_b");
    }

    [Fact]
    public async Task Handle_ShouldAlwaysExcludeCurrentUserFromResults()
    {
        User current = User.Create("alice@work.com", "alice_curr", "pwd");
        User other = User.Create("alice_other@work.com", "alice_other", "pwd");
        _context.Users.AddRange(current, other);
        await _context.SaveChangesAsync();

        SearchUsersQuery query = new(current.Id, "alice");

        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(1);
        result.Value.TotalCount.Should().Be(1);
        result.Value.Items[0].Id.Should().Be(other.Id);
    }

    [Fact]
    public async Task Handle_WithPaginationParams_ShouldRespectPageSizeAndTotalCount()
    {
        User current = User.Create("me@example.com", "myuser", "pwd");
        _context.Users.Add(current);
        for (int i = 1; i <= 5; i++)
        {
            _context.Users.Add(User.Create($"user{i}@test.com", $"testuser{i}", "pwd"));
        }
        await _context.SaveChangesAsync();

        SearchUsersQuery query = new(current.Id, "testuser", new PaginationParams(PageNumber: 1, PageSize: 2));

        var result = await _handler.Handle(query, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(2);
        result.Value.TotalCount.Should().Be(5);
        result.Value.TotalPages.Should().Be(3);
        result.Value.HasNextPage.Should().BeTrue();
        result.Value.HasPreviousPage.Should().BeFalse();
    }
}
