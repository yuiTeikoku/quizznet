using QuizzNetBackend.Models.Game;
using QuizzNetBackend.Models.Users;

namespace QuizzNetBackend.Models.UsersGame
{
    public class UsersGameModel
    {
        public long Id { get; set; }

        public long GameId { get; set; }

        public long UserId { get; set; }

        public long Score { get; set; }

        public virtual GameModel Game { get; set; } = null!;

        public virtual UserModel User { get; set; } = null!;
    }
}
