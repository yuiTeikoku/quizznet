namespace QuizzNetBackend.Models.Game
{
    public class UpdateGameModel
    {
        public long Id { get; set; }
        public string QuizzState { get; set; } = null!;
        public List<long> QuestionsId { get; set; } = null!;
    }
}
