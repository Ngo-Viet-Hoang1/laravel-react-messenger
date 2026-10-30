using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Google.Apis.Auth;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MessengerApp.Infrastructure.Security;

public class GoogleAuthService(
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    ILogger<GoogleAuthService> logger) : IGoogleAuthService
{
    public async Task<Result<GoogleUserPayload>> ValidateIdTokenAsync(string token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Result.Failure<GoogleUserPayload>(
                Error.Validation("Auth.GoogleTokenEmpty", "Google authentication token cannot be empty."));
        }

        token = token.Trim();

        // If token is formatted as a 3-part JWT, attempt GoogleJsonWebSignature validation
        if (token.Split('.').Length == 3)
        {
            try
            {
                string? clientId = configuration["Google:ClientId"];
                GoogleJsonWebSignature.ValidationSettings settings = new();

                if (!string.IsNullOrWhiteSpace(clientId))
                {
                    settings.Audience = new[] { clientId };
                }

                GoogleJsonWebSignature.Payload payload = await GoogleJsonWebSignature.ValidateAsync(token, settings);

                if (!string.IsNullOrWhiteSpace(payload.Email))
                {
                    return Result.Success(new GoogleUserPayload(
                        payload.Email,
                        payload.Name ?? payload.Email.Split('@')[0],
                        payload.Picture,
                        payload.Subject));
                }
            }
            catch (InvalidJwtException ex)
            {
                logger.LogInformation(ex, "Token is not a valid Google JWT ID token. Falling back to OAuth2 userinfo endpoint.");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error while verifying Google ID token. Falling back to OAuth2 userinfo endpoint.");
            }
        }

        // Direct support for Google OAuth2 Access Token (from useGoogleLogin custom button)
        try
        {
            HttpClient client = httpClientFactory.CreateClient();

            // Validate token authenticity, expiration, and audience (Client ID)
            string tokenInfoUrl = $"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={Uri.EscapeDataString(token)}";
            HttpResponseMessage tokenInfoResponse = await client.GetAsync(tokenInfoUrl, ct);

            if (!tokenInfoResponse.IsSuccessStatusCode)
            {
                logger.LogWarning("Google tokeninfo returned status: {StatusCode}", tokenInfoResponse.StatusCode);
                return Result.Failure<GoogleUserPayload>(
                    Error.Unauthorized("Auth.GoogleTokenInvalid", "Google authentication failed: Token is invalid or has expired."));
            }

            Stream tokenInfoJson = await tokenInfoResponse.Content.ReadAsStreamAsync(ct);
            GoogleTokenInfoResponse? tokenInfo = await JsonSerializer.DeserializeAsync<GoogleTokenInfoResponse>(
                tokenInfoJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                ct);

            string? clientId = configuration["Google:ClientId"];
            if (!string.IsNullOrWhiteSpace(clientId) && tokenInfo != null)
            {
                bool matchesAudience = string.Equals(tokenInfo.Aud, clientId, StringComparison.OrdinalIgnoreCase) ||
                                       string.Equals(tokenInfo.Azp, clientId, StringComparison.OrdinalIgnoreCase);

                if (!matchesAudience)
                {
                    logger.LogWarning("Google token audience mismatch. Expected: {ExpectedClientId}, Received aud: {Aud}, azp: {Azp}",
                        clientId, tokenInfo.Aud, tokenInfo.Azp);
                    return Result.Failure<GoogleUserPayload>(
                        Error.Unauthorized("Auth.GoogleAudienceMismatch", "Google token was not issued for this application."));
                }
            }

            // Retrieve user profile (Name, Picture) from userinfo endpoint
            using HttpRequestMessage userinfoRequest = new(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
            userinfoRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            HttpResponseMessage userinfoResponse = await client.SendAsync(userinfoRequest, ct);
            if (userinfoResponse.IsSuccessStatusCode)
            {
                Stream userinfoJson = await userinfoResponse.Content.ReadAsStreamAsync(ct);
                GoogleUserInfoResponse? userInfo = await JsonSerializer.DeserializeAsync<GoogleUserInfoResponse>(
                    userinfoJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                    ct);

                string? email = userInfo?.Email ?? tokenInfo?.Email;
                if (!string.IsNullOrWhiteSpace(email))
                {
                    string name = userInfo?.Name ?? email.Split('@')[0];
                    string sub = userInfo?.Sub ?? tokenInfo?.Sub ?? string.Empty;
                    return Result.Success(new GoogleUserPayload(email, name, userInfo?.Picture, sub));
                }

                return Result.Failure<GoogleUserPayload>(
                    Error.Validation("Auth.GoogleEmailMissing", "Google account does not have an associated email address."));
            }

            // Fallback: If userinfo endpoint fails but tokeninfo succeeded with valid email
            if (tokenInfo != null && !string.IsNullOrWhiteSpace(tokenInfo.Email))
            {
                return Result.Success(new GoogleUserPayload(
                    tokenInfo.Email,
                    tokenInfo.Email.Split('@')[0],
                    null,
                    tokenInfo.Sub ?? string.Empty));
            }

            return Result.Failure<GoogleUserPayload>(
                Error.Unauthorized("Auth.GoogleTokenInvalid", "Google authentication failed: Unable to fetch user profile."));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error validating Google token.");
            return Result.Failure<GoogleUserPayload>(
                Error.Failure("Auth.GoogleTokenError", "Failed to verify credentials with Google."));
        }
    }

    private sealed class GoogleTokenInfoResponse
    {
        [JsonPropertyName("aud")]
        public string? Aud { get; set; }

        [JsonPropertyName("azp")]
        public string? Azp { get; set; }

        [JsonPropertyName("sub")]
        public string? Sub { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("exp")]
        public string? Exp { get; set; }
    }

    private sealed class GoogleUserInfoResponse
    {
        [JsonPropertyName("sub")]
        public string Sub { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("picture")]
        public string? Picture { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("email_verified")]
        public bool EmailVerified { get; set; }
    }
}
