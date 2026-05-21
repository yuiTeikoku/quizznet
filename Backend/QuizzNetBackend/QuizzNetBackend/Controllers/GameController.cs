using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzNetBackend.APIFilters;
using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Models;
using QuizzNetBackend.Models.Game;
using QuizzNetBackend.Models.Questions;
using QuizzNetBackend.Models.Quizz;
using QuizzNetBackend.Models.Users;
using QuizzNetBackend.Models.UsersGame;
using QuizzNetBackend.Services.Scoped;
using QuizzNetBackend.Shared;

namespace QuizzNetBackend.Controllers
{
    [Route("/game/")]
    [ApiController]
    public class GameController : ControllerBase
    {
        private readonly IDbContextFactory<QuizzContext> _dbContextFactory;
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;
        private readonly ILogger<GameController> _logger;
        private readonly PlayGameLogicService _gameService;

        public GameController(IDbContextFactory<QuizzContext> dbContextFactory, IConfiguration config, IMapper mapper, ILogger<GameController> logger, PlayGameLogicService gameService)
        {
            _dbContextFactory = dbContextFactory;
            _config = config;
            _mapper = mapper;
            _logger = logger;
            _gameService = gameService;
        }

        public static List<T> GetShuffledList<T>(IList<T> list)
        {
            Random rng = new Random();
            return list.OrderBy(x => rng.Next()).ToList();
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPut("add")]
        public async Task<ResponseModel<GameModel>> Add(AddGameModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var questions = await context.Questions
                    .AsNoTracking()
                    .Where(x => x.QuizzId == model.QuizzId)
                    .OrderBy(x => x.Order)
                    .Select(x => x.Id)
                    .ToListAsync();

                if (model.ShuffleQuestion) 
                    questions = GetShuffledList(questions);
                
                var newItem = new Game() {
                    LeaderUserId = model.LeaderUserId,
                    QuizzId = model.QuizzId,
                    QuestionsId = questions
                };
                await context.Games.AddAsync(newItem);
                await context.SaveChangesAsync();
                return new(true) { Data = _mapper.Map<GameModel>(newItem) };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPut("start")]
        public async Task<ResponseModel> Start(TypeModel<long> model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var game = await context.Games.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (game == null) return new(false) { Messages = ["Игра не найдена"] };
                _gameService.Start(game.Id);
                return new(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        



        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpDelete("delete")]
        public async Task<ResponseModel> DeleteUser(TypeModel<long> model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var exist = await context.Games.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (exist == null) return new(false) { Messages = ["Игра не найдена"] };
                context.Games.Remove(exist);
                await context.SaveChangesAsync();
                return new(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }


        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPost("update")]
        public async Task<ResponseModel> Update(UpdateGameModel model)
        {
            try
            {
                var crypto = new DetermisticCrypto();
                await using var context = await _dbContextFactory.CreateDbContextAsync();

                var updateItem = await context.Games.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (updateItem == null) return new(false) { Messages = ["Игра не найден"] };

                _mapper.Map(model, updateItem);
                await context.SaveChangesAsync();
                return new(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.AllUsers])]
        [HttpGet("all")]
        public async Task<ResponseModel<List<GameModel>>> GetAll()
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var result = await context.Games
                    .Include(x => x.LeaderUser)
                    .Include(x => x.Quizz)
                    .AsNoTracking()
                    .OrderByDescending(x => x.Id)
                    .Select(x => _mapper.Map<GameModel>(x))
                    .ToListAsync();
                return new(true) { Data = result };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.AllUsers])]
        [HttpPost("registry")]
        public async Task<ResponseModel> Registry(RegistyUserToGameModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var game = await context.Games.AsNoTracking().FirstOrDefaultAsync(x => x.Id == model.GameId);
                if (game == null) return new(false) { Messages = ["Нет данных"] };

                var userdata = ControllerContext.HttpContext.Items["userId"]?.ToString() ?? "-1";
                var userId = Int32.Parse(userdata);
                var access = await context.UsersGames.AsNoTracking().FirstOrDefaultAsync(x => x.GameId == game.Id && x.UserId == userId);
                if (access != null) return new(true);

                await context.UsersGames.AddAsync(new()
                {
                    GameId = game.Id,
                    UserId = userId
                });
                await context.SaveChangesAsync();
                return new(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.AllUsers])]
        [HttpPost("is-registry")]
        public async Task<ResponseModel<bool>> CheckRegistry(RegistyUserToGameModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var game = await context.Games.AsNoTracking().FirstOrDefaultAsync(x => x.Id == model.GameId);
                if (game == null) return new(false) { Messages = ["Нет данных"] };

                var userdata = ControllerContext.HttpContext.Items["userId"]?.ToString() ?? "-1";
                var userId = Int32.Parse(userdata);
                var access = await context.UsersGames.AsNoTracking().FirstOrDefaultAsync(x => x.GameId == game.Id && x.UserId == userId);
                return new(true) { Data = access != null };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }


        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.AllUsers])]
        [HttpPost("send-answer")]
        public async Task<ResponseModel> SendAnswer(SendAnswerModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var game = await context.Games.AsNoTracking().FirstOrDefaultAsync(x => x.Id == model.GameId);
                if (game == null) return new(false) { Messages = ["Нет данных"] };

                var userdata = ControllerContext.HttpContext.Items["userId"]?.ToString() ?? "-1";
                var userId = Int32.Parse(userdata);
                var access = await context.UsersGames.FirstOrDefaultAsync(x => x.GameId == game.Id && x.UserId == userId);
                if (access == null) return new(false) { Messages = ["Доступ запрещен"] };

                var question = await context.Questions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == model.QuestionId);
                if (question == null) return new(false) { Messages = ["Вопрос не найден"] };

                var answer = await context.UserAnswers.FirstOrDefaultAsync(x => x.GameId == game.Id && x.UserId == userId && x.QuestionId == question.Id);
                if (answer != null) return new(true);

                await context.UserAnswers.AddAsync(new()
                {
                    GameId = game.Id,
                    QuestionId = question.Id,
                    UserId = userId,
                    Answer = model.Answer ?? string.Empty,
                });

                if (model.Answer == question.CorrectAnswer)
                    access.Score += question.Points;
                
                await context.SaveChangesAsync();
                return new(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.AllUsers])]
        [HttpPost("is-send-answer")]
        public async Task<ResponseModel<bool>> IsSendAnswer(SendAnswerModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var game = await context.Games.AsNoTracking().FirstOrDefaultAsync(x => x.Id == model.GameId);
                if (game == null) return new(false) { Messages = ["Нет данных"] };

                var userdata = ControllerContext.HttpContext.Items["userId"]?.ToString() ?? "-1";
                var userId = Int32.Parse(userdata);
                var access = await context.UsersGames.AsNoTracking().FirstOrDefaultAsync(x => x.GameId == game.Id && x.UserId == userId);
                if (access == null) return new(false) { Messages = ["Доступ запрещен"] };

                var question = await context.Questions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == model.QuestionId);
                if (question == null) return new(false) { Messages = ["Вопрос не найден"] };

                var answer = await context.UserAnswers.FirstOrDefaultAsync(x => x.GameId == game.Id && x.UserId == userId && x.QuestionId == question.Id);
                return new(true) { Data = answer != null };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }


        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.AllUsers])]
        [HttpGet("link/{link_key}")]
        public async Task<ResponseModel<GameStateModel>> GetQuizz(Guid link_key)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var game = await context.Games.AsNoTracking().FirstOrDefaultAsync(x => x.LinkKey == link_key);
                if (game == null) return new(false) { Messages = ["Нет данных"] };

                var userdata = ControllerContext.HttpContext.Items["userId"]?.ToString() ?? "-1";
                var userId = Int32.Parse(userdata);
                var access = await context.UsersGames.AsNoTracking().FirstOrDefaultAsync(x => x.GameId == game.Id && x.UserId == userId);
                if (access == null) return new(false) { Messages = ["Доступ запрещен"] };

                var gameState = new GameStateModel() { GameId = game.Id, QuizzState = game.QuizzState };
                switch (game.QuizzState)
                {
                    case nameof(GameState.OnPlay):
                        var questionId = game.QuestionsId.First();
                        var question = await context.Questions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == questionId);
                        if (question == null) return new(false) { Messages = ["Вопрос не найден"] };
                        
                        gameState.Question = _mapper.Map<QuestionModel>(question);
                        return new(true) { Data = gameState };

                    case nameof(GameState.Registry):
                    case nameof(GameState.End):
                        return new(true) { Data = gameState };

                    default: 
                        return new(false) { Messages = ["Статус игры неизвестен"] };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpGet("statistics/{link_key}")]
        public async Task<ResponseModel<List<UsersGameModel>>> Statistics(Guid link_key)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var game = await context.Games.AsNoTracking().FirstOrDefaultAsync(x => x.LinkKey == link_key);
                if (game == null) return new(false) { Messages = ["Нет данных"] };

                var result = await context.UsersGames
                    .Include(x => x.User)
                    .Include(x => x.Game)
                    .AsNoTracking()
                    .Where(x => x.GameId == game.Id)
                    .OrderByDescending(x => x.Score)
                    .Select(x => _mapper.Map<UsersGameModel>(x))
                    .ToListAsync();
                return new(true) { Data = result };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }
    }
}
