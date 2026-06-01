using System;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace Assessment.SurveyIQ.Utilities
{
    public class PasswordHelper
    {
        public string HashPassword(string password)
        {
            var salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }
            var hash = KeyDerivation.Pbkdf2(password, salt, KeyDerivationPrf.HMACSHA256, 100000, 32);
            return Convert.ToBase64String(Combine(salt, hash));
        }

        public bool VerifyPassword(string password, string storedHash)
        {
            try
            {
                var data = Convert.FromBase64String(storedHash);
                var salt = new byte[16];
                Array.Copy(data, 0, salt, 0, 16);
                var hash = new byte[32];
                Array.Copy(data, 16, hash, 0, 32);
                var testHash = KeyDerivation.Pbkdf2(password, salt, KeyDerivationPrf.HMACSHA256, 100000, 32);
                return CryptographicOperations.FixedTimeEquals(testHash, hash);
            }
            catch
            {
                return false;
            }
        }

        private static byte[] Combine(byte[] salt, byte[] hash)
        {
            var data = new byte[salt.Length + hash.Length];
            Buffer.BlockCopy(salt, 0, data, 0, salt.Length);
            Buffer.BlockCopy(hash, 0, data, salt.Length, hash.Length);
            return data;
        }
    }
}
