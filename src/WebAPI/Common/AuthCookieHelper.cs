using Microsoft.AspNetCore.Http;

namespace MessengerApp.WebAPI.Common;

public static class AuthCookieHelper
{
    public const string RefreshTokenCookieName = "refreshToken";
    public const string CookiePath = "/api/auth";

    public static string? GetRefreshToken(HttpRequest request)
        => request.Cookies[RefreshTokenCookieName];

    public static void SetRefreshToken(HttpResponse response, HttpRequest request, string token, DateTimeOffset expiresAt)
    {
        var isHttps = request.IsHttps;
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Expires = expiresAt.UtcDateTime,
            Path = CookiePath
        };
        response.Cookies.Append(RefreshTokenCookieName, token, cookieOptions);
    }

    public static void DeleteRefreshToken(HttpResponse response, HttpRequest request)
    {
        var isHttps = request.IsHttps;
        response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = CookiePath,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax
        });
    }
}
