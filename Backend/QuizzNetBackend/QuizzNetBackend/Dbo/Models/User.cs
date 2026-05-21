using System;
using System.Collections.Generic;

namespace QuizzNetBackend.Dbo.Models;

public partial class User
{
    public long Id { get; set; }

    public string Nickname { get; set; } = null!;

    public string Password { get; set; } = null!;

    public string UserType { get; set; } = null!;

    public DateTime LastAuth { get; set; }

    public virtual ICollection<Game> Games { get; set; } = new List<Game>();

    public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();

    public virtual ICollection<UsersGame> UsersGames { get; set; } = new List<UsersGame>();
}
