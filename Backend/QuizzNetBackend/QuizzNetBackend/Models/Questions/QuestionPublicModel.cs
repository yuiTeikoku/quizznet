namespace QuizzNetBackend.Models.Questions
{
    public class QuestionPublicModel
    {
        public long Id { get; set; }

        public long QuizzId { get; set; }

        public string? QuestionType { get; set; }

        public string? QuestionData { get; set; }

        public string? AnswerType { get; set; }

        public string? AnswerData { get; set; }
    }
}
