namespace QuizzNetBackend.Models.Users
{
    public class UserModel
    {
        public long Id { get; set; }

        public string Nickname { get; set; } = null!;

        public string UserType { get; set; } = null!;
    }
}
