namespace QuizzNetBackend.Models.Game
{
    public class AddGameModel
    {
        public long QuizzId { get; set; } 
        public long LeaderUserId { get; set; }
        public bool ShuffleQuestion = false;
    }
}
