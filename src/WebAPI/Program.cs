using System.Text;
using MessengerApp.Application;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Infrastructure;
using MessengerApp.Infrastructure.Persistence;
using MessengerApp.WebAPI.Extensions;
using MessengerApp.WebAPI.Hubs;
using MessengerApp.WebAPI.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "ClientAppCorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("X-Correlation-ID");
    });
});

builder.Services.AddControllers();
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
});
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.Configure<HostOptions>(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(builder.Environment.IsDevelopment() ? 2 : 30);
});

var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey is required.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is required.");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is required.");

if (Encoding.UTF8.GetByteCount(jwtSecretKey) < 32)
{
    throw new InvalidOperationException("Jwt:SecretKey must be at least 32 bytes.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    options.ConfigureSignalRAuthentication();
});

builder.Services.AddAuthorization();

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddOpenApi();

if (!builder.Environment.IsDevelopment())
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    });
}

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseForwardedHeaders();
}

app.Use(async (context, next) =>
{
    const string headerName = "X-Correlation-ID";
    var correlationId = context.Request.Headers[headerName].FirstOrDefault();

    if (string.IsNullOrWhiteSpace(correlationId))
    {
        correlationId = Guid.NewGuid().ToString();
    }

    context.TraceIdentifier = correlationId;
    context.Response.Headers[headerName] = correlationId;

    await next();
});

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();

    // Dev-only smoke test endpoint for validating RFC 7807/9457 error pipeline
    app.MapGet("/api/test/error", () =>
    {
        throw new InvalidOperationException("Test exception to verify RFC 7807/9457 ProblemDetails pipeline.");
    })
    .WithName("TestErrorEndpoint");

    // Dev-only manual re-seed endpoint
    app.MapPost("/api/test/seed", async (AppDbContext db, IPasswordHasher hasher, ILoggerFactory loggerFactory) =>
    {
        var logger = loggerFactory.CreateLogger("DbInitializer");
        await DbInitializer.SeedAsync(db, hasher, logger);
        await MessageSeeder.SeedAsync(db, logger, force: true);
        return Results.Ok(new { message = "Database successfully seeded with realistic sample data." });
    })
    .WithName("SeedDatabase");

    // Automatic seed check on startup
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger("DbInitializer");
        await DbInitializer.SeedAsync(db, hasher, logger);
        await MessageSeeder.SeedAsync(db, logger);

        try
        {
            var storageService = scope.ServiceProvider.GetRequiredService<IObjectStorageService>();
            await storageService.EnsureBucketExistsAsync();
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Could not initialize object storage bucket on startup.");
        }
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseCors(CorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.MapFallbackToFile("index.html");

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    version = "1.0.0",
    service = "MessengerApp WebAPI",
    timestamp = DateTimeOffset.UtcNow
}))
.WithName("HealthCheck");

app.Run();
