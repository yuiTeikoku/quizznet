using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Hubs;
using QuizzNetBackend.Shared;
using System.Threading.Channels;

namespace QuizzNetBackend.Services.Scoped
{
    public class PlayGameLogicService
    {
        private readonly IHubContext<QuizzHub> _hubContext;
        private readonly IDbContextFactory<QuizzContext> _dbContextFactory;

        public PlayGameLogicService(IDbContextFactory<QuizzContext> dbContextFactory, IHubContext<QuizzHub> hubContext)
        {
            _hubContext = hubContext;
            _dbContextFactory = dbContextFactory;
        }

        public async Task Start(long Id)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var game = await context.Games.FirstAsync(x => x.Id == Id);
                var channelId = game.LinkKey.ToString();

                game.QuizzState = GameState.OnPlay.ToString();
                await context.SaveChangesAsync();
                await _hubContext.Clients.Group(channelId).SendAsync("update-state-game", GameState.OnPlay.ToString());

                while (true)
                {
                    await ShowTimer(channelId);
                    var questions = game.QuestionsId;
                    if (questions.Count == 1)
                    {
                        game.QuizzState = GameState.End.ToString();
                        await context.SaveChangesAsync();
                        await _hubContext.Clients.Group(channelId).SendAsync("update-state-game", GameState.End.ToString());
                        return;
                    }

                    game.QuestionsId = questions.Skip(1).ToList();
                    await context.SaveChangesAsync();
                    await _hubContext.Clients.Group(channelId).SendAsync("update-state-game", GameState.OnPlay.ToString());
                }
            }
            catch
            {
                return;
            }
           
        }

        private int _totalSecondFromRound = 30;
        private async Task ShowTimer(string channelId)
        {
            var timer = _totalSecondFromRound;
            var start = DateTime.Now;
            while (timer > 0)
            {
                var dist = DateTime.Now - start;

                await _hubContext.Clients.Group(channelId).SendAsync("game-timer", timer);
                await Task.Delay(200);
                timer = _totalSecondFromRound - (int) dist.TotalSeconds;
            }
        }
    }
}
