using System.Security.Cryptography;
using System.Text;

namespace QuizzNetBackend.Shared
{
    public class DetermisticCrypto
    {
        private readonly byte[] _fixedKey;
        private readonly byte[] _fixedIv;

        public DetermisticCrypto()
        {
            byte[] salt = Encoding.UTF8.GetBytes("123saltpostprefcniitu!");
            string password = "cniitutestdeeet!";

            _fixedKey = Rfc2898DeriveBytes.Pbkdf2(
                password: password,
                salt: salt,
                iterations: 10000,
                hashAlgorithm: HashAlgorithmName.SHA256,
                outputLength: 32);

            _fixedIv = Rfc2898DeriveBytes.Pbkdf2(
                password: password,
                salt: salt,
                iterations: 10000,
                hashAlgorithm: HashAlgorithmName.SHA256,
                outputLength: 16);
        }

        public DetermisticCrypto(byte[] key, byte[] iv)
        {
            if (key.Length != 32) throw new ArgumentException("Key must be 32 bytes (256 bit)");
            if (iv.Length != 16) throw new ArgumentException("IV must be 16 bytes (128 bit)");

            _fixedKey = key;
            _fixedIv = iv;
        }

        public string Encrypt(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = _fixedKey;
            aes.IV = _fixedIv;
            aes.Mode = CipherMode.CBC; // Режим CBC для детерминированности с фиксированным IV
            aes.Padding = PaddingMode.PKCS7;

            using var encryptor = aes.CreateEncryptor();
            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            var encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            // Для удобства кодируем в Base64
            return Convert.ToBase64String(encryptedBytes);
        }

        public string Decrypt(string encryptedText)
        {
            using var aes = Aes.Create();
            aes.Key = _fixedKey;
            aes.IV = _fixedIv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            var encryptedBytes = Convert.FromBase64String(encryptedText);
            var decryptedBytes = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);

            return Encoding.UTF8.GetString(decryptedBytes);
        }

        public (byte[] Key, byte[] IV) GetKeyMaterial()
        {
            return (_fixedKey.ToArray(), _fixedIv.ToArray());
        }
    }
}
