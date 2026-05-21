namespace QuizzNetBackend.Models.Game
{
    public class SendAnswerModel
    {
        public long GameId { get; set; }

        public long QuestionId { get; set; }

        public string? Answer { get; set; } = null!;
    }
}
