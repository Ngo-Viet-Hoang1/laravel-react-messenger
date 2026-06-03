using MessengerApp.WebAPI.Middleware;

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

    // Dev-only smoke test endpoint for validating RFC 7807/9457 error pipeline
    app.MapGet("/api/test/error", () =>
    {
        throw new InvalidOperationException("Test exception to verify RFC 7807/9457 ProblemDetails pipeline.");
    })
    .WithName("TestErrorEndpoint");
}

app.UseHttpsRedirection();
app.UseCors(CorsPolicy);

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    version = "1.0.0",
    service = "MessengerApp WebAPI",
    timestamp = DateTimeOffset.UtcNow
}))
.WithName("HealthCheck");

app.Run();
