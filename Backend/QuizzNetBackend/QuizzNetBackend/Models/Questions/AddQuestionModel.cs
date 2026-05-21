namespace QuizzNetBackend.Models.Questions
{
    public class AddQuestionModel
    {
        public long QuizzId { get; set; }
        public string QuestionType { get; set; } = string.Empty;

        public string QuestionData { get; set; } = string.Empty;

        public string AnswerType { get; set; } = string.Empty;

        public string AnswerData { get; set; } = string.Empty;

        public string CorrectAnswer { get; set; } = string.Empty;
    }
}
