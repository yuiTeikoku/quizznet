using System;
using System.Collections.Generic;

namespace QuizzNetBackend.Dbo.Models;

public partial class Quizz
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<Game> Games { get; set; } = new List<Game>();

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
}
