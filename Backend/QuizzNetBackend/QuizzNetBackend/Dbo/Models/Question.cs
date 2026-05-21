using System;
using System.Collections.Generic;

namespace QuizzNetBackend.Dbo.Models;

public partial class Question
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

    public virtual Quizz Quizz { get; set; } = null!;

    public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
}
