using System.Text;

namespace QuizzNetBackend.Shared
{
    public class RandomSeq
    {
        private static Random rand = new Random();
        public static string GenerateLogin()
        {
            return Generate(8, false);
        }

        public static string GeneratePassword()
        {
            return Generate(12, true);
        }

        public static string Generate(int length, bool isPassword)
        {
            // old
            string alph = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            string result = "";
            for (int i = 0; i < length; i++)
                result += alph[rand.Next(alph.Length)];
            if (!isPassword) return result;

            // add special char in old sequece
            StringBuilder output = new StringBuilder(result);
            string specChar = "!#$%&,*";
            output[2] = specChar[rand.Next(specChar.Length)];
            output[5] = specChar[rand.Next(specChar.Length)];
            return output.ToString();
        }
    }
}
