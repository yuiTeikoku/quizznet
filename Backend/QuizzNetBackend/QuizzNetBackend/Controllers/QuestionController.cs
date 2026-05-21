using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzNetBackend.APIFilters;
using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Models;
using QuizzNetBackend.Models.Questions;
using QuizzNetBackend.Models.Quizz;

namespace QuizzNetBackend.Controllers
{
    [Route("/question/")]
    [ApiController]
    public class QuestionController : ControllerBase
    {
        private readonly IDbContextFactory<QuizzContext> _dbContextFactory;
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;
        private readonly ILogger<QuestionController> _logger;

        public QuestionController(IDbContextFactory<QuizzContext> dbContextFactory, IConfiguration config, IMapper mapper, ILogger<QuestionController> logger)
        {
            _dbContextFactory = dbContextFactory;
            _config = config;
            _mapper = mapper;
            _logger = logger;
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPut("add")]
        public async Task<ResponseModel<QuestionModel>> Add(AddQuestionModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var newItem = _mapper.Map<Question>(model);
                await context.Questions.AddAsync(newItem);
                await context.SaveChangesAsync();
                return new(true) { Data = _mapper.Map<QuestionModel>(model) };

            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPost("update")]
        public async Task<ResponseModel> Update(UpdateQuestionModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var updateItem = await context.Questions.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (updateItem == null) return new(false) { Messages = ["Вопрос не найден"] };
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

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpDelete("delete")]
        public async Task<ResponseModel> DeleteUser(TypeModel<long> model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var exist = await context.Questions.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (exist == null) return new(false) { Messages = ["Вопрос не найден"] };
                context.Questions.Remove(exist);
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
        [HttpGet("quizz/{quizzId}")]
        public async Task<ResponseModel<List<QuestionModel>>> GetAll(long quizzId)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var result = await context.Questions
                    .AsNoTracking()
                    .Where(x => x.QuizzId == quizzId)
                    .OrderByDescending(x => x.Id)
                    .Select(x => _mapper.Map<QuestionModel>(x))
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
