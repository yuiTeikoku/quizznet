namespace QuizzNetBackend.Models.Users
{
    public class UpdateUserModel
    {
        public long Id { get; set; }

        public string Nickname { get; set; } = null!;

        public string Password { get; set; } = null!;

        public string UserType { get; set; } = null!;
    }
}
