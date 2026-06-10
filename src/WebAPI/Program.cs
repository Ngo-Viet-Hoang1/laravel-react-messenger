using System.Text;
using MessengerApp.Application;
using MessengerApp.Infrastructure;
using MessengerApp.WebAPI.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "super-secret-messenger-app-key-with-at-least-256-bits-length!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MessengerApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MessengerAppClient";

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
});

builder.Services.AddAuthorization();

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddOpenApi();

var app = builder.Build();

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
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors(CorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    version = "1.0.0",
    service = "MessengerApp WebAPI",
    timestamp = DateTimeOffset.UtcNow
}))
.WithName("HealthCheck");

app.Run();
