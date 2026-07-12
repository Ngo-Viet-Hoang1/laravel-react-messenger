using Amazon.Runtime;
using Amazon.S3;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Infrastructure.Persistence;
using MessengerApp.Infrastructure.Persistence.Interceptors;
using MessengerApp.Infrastructure.Presence;
using MessengerApp.Infrastructure.Security;
using MessengerApp.Infrastructure.Services;
using MessengerApp.Infrastructure.Services.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace MessengerApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddHttpClient();
        services.AddScoped<IClientInfoProvider, ClientInfoProvider>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<AuditableEntityInterceptor>();

        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            var interceptor = serviceProvider.GetRequiredService<AuditableEntityInterceptor>();

            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null);
                npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
            });

            options.AddInterceptors(interceptor);
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IPasswordHasher, Argon2PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        services.AddSingleton<IPresenceTracker, PresenceTracker>();

        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.AddSingleton<IAmazonS3>(sp =>
        {
            var storageOptions = sp.GetRequiredService<IOptions<StorageOptions>>().Value;
            var config = new AmazonS3Config
            {
                ServiceURL = storageOptions.ServiceUrl,
                ForcePathStyle = storageOptions.ForcePathStyle,
                UseHttp = storageOptions.ServiceUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            };
            var credentials = new BasicAWSCredentials(storageOptions.AccessKey, storageOptions.SecretKey);
            return new AmazonS3Client(credentials, config);
        });
        services.AddScoped<IObjectStorageService, S3ObjectStorageService>();

        return services;
    }
}
