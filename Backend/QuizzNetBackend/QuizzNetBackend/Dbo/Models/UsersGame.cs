using System;
using System.Collections.Generic;

namespace QuizzNetBackend.Dbo.Models;

public partial class UsersGame
{
    public long Id { get; set; }

    public long GameId { get; set; }

    public long UserId { get; set; }

    public long Score { get; set; }

    public virtual Game Game { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
