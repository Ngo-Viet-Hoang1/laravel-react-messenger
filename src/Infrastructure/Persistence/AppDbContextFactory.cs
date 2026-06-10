using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MessengerApp.Infrastructure.Persistence;

/// <summary>
/// Design-time factory ensuring EF Core CLI tools can discover DbContext without requiring active DI scope.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=messenger_db;Username=postgres;Password=postgres;");

        return new AppDbContext(optionsBuilder.Options);
    }
}
