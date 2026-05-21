namespace QuizzNetBackend.Models.Questions
{
    public class QuestionModel
    {
        public long Id { get; set; }

        public long QuizzId { get; set; }

        public long Order { get; set; }

        public string? QuestionType { get; set; }

        public string? QuestionData { get; set; }

        public string? AnswerType { get; set; }

        public string? AnswerData { get; set; }

        public string? CorrectAnswer { get; set; }

        public long Points { get; set; }
    }
}
