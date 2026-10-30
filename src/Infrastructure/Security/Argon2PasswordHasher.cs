using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;
using MessengerApp.Application.Common.Interfaces;

namespace MessengerApp.Infrastructure.Security;

/// <summary>
/// Enterprise-grade password hasher utilizing the Argon2id algorithm (RFC 9106 / OWASP recommended).
/// Incorporates constant-time verification to prevent timing side-channel attacks.
/// </summary>
public class Argon2PasswordHasher : IPasswordHasher
{
    private const int SaltByteSize = 16;
    private const int HashByteSize = 32;
    private const int Iterations = 2;
    private const int MemorySizeKb = 19456; // 19 MB (OWASP minimum recommendation for Argon2id)
    private const int DegreeOfParallelism = 1;

    public string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltByteSize);
        var hash = ComputeArgon2idHash(password, salt);

        var saltBase64 = Convert.ToBase64String(salt);
        var hashBase64 = Convert.ToBase64String(hash);

        // Standardized format: $argon2id$v=19$m={MemorySizeKb},t={Iterations},p={DegreeOfParallelism}${salt}${hash}
        return $"$argon2id$v=19$m={MemorySizeKb},t={Iterations},p={DegreeOfParallelism}${saltBase64}${hashBase64}";
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        try
        {
            var parts = passwordHash.Split('$', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 4)
            {
                return false;
            }

            // Expected parts:
            // 0: "argon2id"
            // 1: "v=19"
            // 2: "m=19456,t=2,p=1"
            // 3: saltBase64
            // 4: hashBase64
            string saltBase64;
            string expectedHashBase64;

            if (parts.Length == 5)
            {
                saltBase64 = parts[3];
                expectedHashBase64 = parts[4];
            }
            else
            {
                // Fallback support for format: $argon2id$salt$hash
                saltBase64 = parts[1];
                expectedHashBase64 = parts[2];
            }

            var salt = Convert.FromBase64String(saltBase64);
            var expectedHash = Convert.FromBase64String(expectedHashBase64);

            var computedHash = ComputeArgon2idHash(password, salt);

            // Constant-time comparison to prevent timing attacks
            return CryptographicOperations.FixedTimeEquals(computedHash, expectedHash);
        }
        catch
        {
            return false;
        }
    }

    private static byte[] ComputeArgon2idHash(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = DegreeOfParallelism,
            MemorySize = MemorySizeKb,
            Iterations = Iterations
        };

        return argon2.GetBytes(HashByteSize);
    }
}
