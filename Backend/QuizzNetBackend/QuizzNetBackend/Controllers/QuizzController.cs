using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzNetBackend.APIFilters;
using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Models;
using QuizzNetBackend.Models.Quizz;
using QuizzNetBackend.Models.Users;
using QuizzNetBackend.Shared;

namespace QuizzNetBackend.Controllers
{
    [Route("/quizz/")]
    [ApiController]
    public class QuizzController : ControllerBase
    {
        private readonly IDbContextFactory<QuizzContext> _dbContextFactory;
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;
        private readonly ILogger<QuizzController> _logger;

        public QuizzController(IDbContextFactory<QuizzContext> dbContextFactory, IConfiguration config, IMapper mapper, ILogger<QuizzController> logger)
        {
            _dbContextFactory = dbContextFactory;
            _config = config;
            _mapper = mapper;
            _logger = logger;
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPut("add")]
        public async Task<ResponseModel<QuizzModel>> Add(AddQuizzModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var newItem = _mapper.Map<Quizz>(model);
                await context.Quizzs.AddAsync(newItem);
                await context.SaveChangesAsync();
                return new(true) { Data = _mapper.Map<QuizzModel>(model) };

            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPost("update")]
        public async Task<ResponseModel> Update(UpdateQuizzModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var updateItem = await context.Quizzs.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (updateItem == null) return new(false) { Messages = ["Квиз не найден"] };
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
                var exist = await context.Quizzs.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (exist == null) return new(false) { Messages = ["Квиз не найден"] };
                context.Quizzs.Remove(exist);
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
        [HttpGet("all")]
        public async Task<ResponseModel<List<QuizzModel>>> GetAll()
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var result = await context.Quizzs
                    .AsNoTracking()
                    .OrderByDescending(x => x.Id)
                    .Select(x => _mapper.Map<QuizzModel>(x))
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
