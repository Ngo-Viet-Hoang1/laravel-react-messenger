using System.Security.Claims;
using MessengerApp.Domain.Common;
using Microsoft.AspNetCore.Mvc;

namespace MessengerApp.WebAPI.Common;

/// <summary>
/// Enterprise Base API Controller providing RFC 7807/9457 compliant Result-to-HTTP response translations.
/// Standardizes HTTP status codes, correlation trace IDs, error type URIs, and validation details.
/// </summary>
[ApiController]
public abstract class ApiController : ControllerBase
{
    /// <summary>
    /// Resolves the authenticated user's ID from the JWT claims principal.
    /// Returns Guid.Empty if unauthenticated or invalid.
    /// </summary>
    protected Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            return Guid.TryParse(idClaim, out var userId) ? userId : Guid.Empty;
        }
    }

    /// <summary>
    /// Translates a generic Result into a 200 OK response with payload, or a RFC ProblemDetails response on failure.
    /// </summary>
    protected IActionResult HandleResult<T>(Result<T> result)
    {
        return result.IsSuccess
            ? Ok(result.Value)
            : HandleFailure(result.Error);
    }

    /// <summary>
    /// Translates a void Result into a 200 OK response, or a RFC ProblemDetails response on failure.
    /// </summary>
    protected IActionResult HandleResult(Result result)
    {
        return result.IsSuccess
            ? Ok()
            : HandleFailure(result.Error);
    }

    /// <summary>
    /// Translates a successful creation Result into a 201 Created response, or a RFC ProblemDetails response on failure.
    /// </summary>
    protected IActionResult HandleCreatedResult<T>(Result<T> result, string uri = "")
    {
        return result.IsSuccess
            ? Created(uri, result.Value)
            : HandleFailure(result.Error);
    }

    /// <summary>
    /// Translates a successful creation Result into a 201 CreatedAtAction response, or a RFC ProblemDetails response on failure.
    /// </summary>
    protected IActionResult HandleCreatedAtActionResult<T>(Result<T> result, string actionName, object? routeValues)
    {
        return result.IsSuccess
            ? CreatedAtAction(actionName, routeValues, result.Value)
            : HandleFailure(result.Error);
    }

    /// <summary>
    /// Translates a successful action with no response body into a 204 NoContent response, or a RFC ProblemDetails response on failure.
    /// </summary>
    protected IActionResult HandleNoContentResult(Result result)
    {
        return result.IsSuccess
            ? NoContent()
            : HandleFailure(result.Error);
    }

    /// <summary>
    /// Converts a Domain/Application Error into a standardized RFC 7807/9457 ProblemDetails response.
    /// </summary>
    protected IActionResult HandleFailure(Error error)
    {
        var (statusCode, title, typeUrl) = error.Type switch
        {
            ErrorType.Validation => (
                StatusCodes.Status400BadRequest,
                "Bad Request",
                "https://tools.ietf.org/html/rfc9110#section-15.5.1"),

            ErrorType.NotFound => (
                StatusCodes.Status404NotFound,
                "Not Found",
                "https://tools.ietf.org/html/rfc9110#section-15.5.5"),

            ErrorType.Conflict => (
                StatusCodes.Status409Conflict,
                "Conflict",
                "https://tools.ietf.org/html/rfc9110#section-15.5.10"),

            ErrorType.Unauthorized => (
                StatusCodes.Status401Unauthorized,
                "Unauthorized",
                "https://tools.ietf.org/html/rfc9110#section-15.5.2"),

            ErrorType.Forbidden => (
                StatusCodes.Status403Forbidden,
                "Forbidden",
                "https://tools.ietf.org/html/rfc9110#section-15.5.4"),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Internal Server Error",
                "https://tools.ietf.org/html/rfc9110#section-15.6.1")
        };

        if (error is ValidationError validationError)
        {
            var errors = validationError.Errors
                .GroupBy(e => e.Code)
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());

            var validationProblemDetails = new ValidationProblemDetails(errors)
            {
                Status = statusCode,
                Title = "Validation Failed",
                Type = typeUrl,
                Detail = error.Description,
                Instance = HttpContext.Request.Path
            };

            validationProblemDetails.Extensions["traceId"] = HttpContext.TraceIdentifier;
            validationProblemDetails.Extensions["timestamp"] = DateTimeOffset.UtcNow;

            return ValidationProblem(validationProblemDetails);
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Type = typeUrl,
            Detail = error.Description,
            Instance = HttpContext.Request.Path
        };

        problemDetails.Extensions["errorCode"] = error.Code;
        problemDetails.Extensions["traceId"] = HttpContext.TraceIdentifier;
        problemDetails.Extensions["timestamp"] = DateTimeOffset.UtcNow;

        return StatusCode(statusCode, problemDetails);
    }
}
