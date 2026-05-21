using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Models.Quizz;
using QuizzNetBackend.Models.Users;

namespace QuizzNetBackend.Models.Game
{
    public class GameModel
    {
        public string QuizzId { get; set; } = null!;

        public string QuizzState { get; set; } = null!;

        public List<long> QuestionsId { get; set; } = null!;

        public long Id { get; set; }

        public Guid LinkKey { get; set; }

        public string LeaderUserId { get; set; } = null!;

        public DateTime CreateAt { get; set; }

        public virtual UserModel LeaderUser { get; set; } = null!;

        public virtual QuizzModel Quizz { get; set; } = null!;
    }
}
