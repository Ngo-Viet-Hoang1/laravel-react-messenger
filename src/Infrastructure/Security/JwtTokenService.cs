using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MessengerApp.Application.Common.Interfaces;
using MessengerApp.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MessengerApp.Infrastructure.Security;

/// <summary>
/// Service responsible for issuing secure JSON Web Tokens (Access Tokens) and Refresh Tokens.
/// </summary>
public class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    private const string DefaultSecret = "super-secret-messenger-app-key-with-at-least-256-bits-length!";

    public string GenerateAccessToken(User user)
    {
        var secretKey = configuration["Jwt:SecretKey"] ?? DefaultSecret;
        var issuer = configuration["Jwt:Issuer"] ?? "MessengerApp";
        var audience = configuration["Jwt:Audience"] ?? "MessengerAppClient";
        var expirationMinutes = int.TryParse(configuration["Jwt:AccessTokenExpirationMinutes"], out var minutes) ? minutes : 15;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public RefreshToken GenerateRefreshToken(Guid userId, string? ipAddress = null)
    {
        var expirationDays = int.TryParse(configuration["Jwt:RefreshTokenExpirationDays"], out var days) ? days : 7;
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(randomBytes);

        return new RefreshToken(
            userId,
            token,
            DateTimeOffset.UtcNow.AddDays(expirationDays),
            ipAddress);
    }
}
