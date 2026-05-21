using QuizzNetBackend.Models.Questions;

namespace QuizzNetBackend.Models.Game
{
    public class GameStateModel
    {
        public long GameId {  get; set; }
        public string QuizzState { get; set; } = string.Empty;
        public QuestionModel? Question { get; set; }
    }
}
