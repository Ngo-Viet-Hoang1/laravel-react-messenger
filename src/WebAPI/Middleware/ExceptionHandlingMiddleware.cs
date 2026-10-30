using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace MessengerApp.WebAPI.Middleware;

public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment environment) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var traceId = httpContext.TraceIdentifier;

        httpContext.Response.Headers["X-Correlation-ID"] = traceId;

        logger.LogError(
            exception,
            "Unhandled exception occurred while processing request on {Path}. TraceId: {TraceId}",
            httpContext.Request.Path,
            traceId);

        var statusCode = StatusCodes.Status500InternalServerError;
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = "Internal Server Error",
            Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1",
            Instance = httpContext.Request.Path,
            Detail = environment.IsDevelopment()
                ? $"{exception.GetType().Name}: {exception.Message}"
                : "An unexpected error occurred. Please contact system support with your TraceId."
        };

        problemDetails.Extensions["traceId"] = traceId;
        problemDetails.Extensions["timestamp"] = DateTimeOffset.UtcNow;

        if (environment.IsDevelopment())
        {
            problemDetails.Extensions["stackTrace"] = exception.StackTrace;
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
