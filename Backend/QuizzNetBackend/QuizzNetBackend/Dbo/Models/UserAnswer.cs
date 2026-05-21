using System;
using System.Collections.Generic;

namespace QuizzNetBackend.Dbo.Models;

public partial class UserAnswer
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public long GameId { get; set; }

    public long QuestionId { get; set; }

    public string Answer { get; set; } = null!;

    public virtual Game Game { get; set; } = null!;

    public virtual Question Question { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
