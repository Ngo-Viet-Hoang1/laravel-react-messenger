var builder = WebApplication.CreateBuilder(args);

// 1. Add CORS Policy for Frontend (Vite)
const string CorsPolicy = "ClientAppCorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors(CorsPolicy);

// Health check endpoint
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    version = "1.0.0",
    service = "MessengerApp WebAPI",
    timestamp = DateTimeOffset.UtcNow
}))
.WithName("HealthCheck");

app.Run();
