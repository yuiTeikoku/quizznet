using System;
using System.Collections.Generic;

namespace QuizzNetBackend.Dbo.Models;

public partial class Game
{
    public long QuizzId { get; set; }

    public string QuizzState { get; set; } = null!;

    public List<long> QuestionsId { get; set; } = null!;

    public long Id { get; set; }

    public Guid LinkKey { get; set; }

    public long LeaderUserId { get; set; }

    public DateTime CreateAt { get; set; }

    public virtual User LeaderUser { get; set; } = null!;

    public virtual Quizz Quizz { get; set; } = null!;

    public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();

    public virtual ICollection<UsersGame> UsersGames { get; set; } = new List<UsersGame>();
}
