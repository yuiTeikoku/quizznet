using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzNetBackend.APIFilters;
using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Models;
using QuizzNetBackend.Models.Users;
using QuizzNetBackend.Shared;

namespace QuizzNetBackend.Controllers
{
    [Route("/users/")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IDbContextFactory<QuizzContext> _dbContextFactory;
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IDbContextFactory<QuizzContext> dbContextFactory, IConfiguration config, IMapper mapper, ILogger<UsersController> logger)
        {
            _dbContextFactory = dbContextFactory;
            _config = config;
            _mapper = mapper;
            _logger = logger;
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPut("add")]
        public async Task<ResponseModel<UserModel>> Add(AddUserModel model)
        {
            try
            {
                var crypto = new DetermisticCrypto();
                await using var context = await _dbContextFactory.CreateDbContextAsync();

                var newItem = _mapper.Map<User>(model);

                var clearPassword = RandomSeq.GeneratePassword();
                newItem.Password = crypto.Encrypt(clearPassword);

                var uniqLogin = await context.Users.FirstOrDefaultAsync(x => x.Nickname == newItem.Nickname);
                if (uniqLogin != null) return new(false) { Messages = ["Такой логин уже есть"] };

                while (await context.Users.AnyAsync(x => x.Nickname == newItem.Nickname && x.Password == newItem.Password))
                {
                    clearPassword = RandomSeq.GeneratePassword();
                    newItem.Password = crypto.Encrypt(clearPassword);
                }
                await context.Users.AddAsync(newItem);
                await context.SaveChangesAsync();
                return new(true) { Data = _mapper.Map<UserModel>(newItem) };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [TypeFilter(typeof(ApiRoleFilter), Arguments = [FilterTypes.Admin])]
        [HttpPost("update")]
        public async Task<ResponseModel> Update(UpdateUserModel model)
        {
            try
            {
                var crypto = new DetermisticCrypto();
                await using var context = await _dbContextFactory.CreateDbContextAsync();

                var updateItem = await context.Users.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (updateItem == null) return new(false) { Messages = ["Пользователь не найден"] };

                _mapper.Map(model, updateItem);

                if (model.Password != null) updateItem.Password = crypto.Encrypt(model.Password);

                if (model.Nickname != null)
                {
                    var uniqLogin = await context.Users.FirstOrDefaultAsync(x => x.Nickname == model.Nickname);
                    if (uniqLogin != null) return new(false) { Messages = ["Такой логин уже есть"] };
                }

                if (model.Password != null || model.Nickname != null)
                {
                    var exist = await context.Users.FirstOrDefaultAsync(x => x.Nickname == updateItem.Nickname && x.Password == updateItem.Password);
                    if (exist != null) return new(false) { Messages = ["Логин или пароль не уникальны"] };
                }

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
                var exist = await context.Users.FirstOrDefaultAsync(x => x.Id == model.Id);
                if (exist == null) return new(false) { Messages = ["Пользователь не найден"] };

                if (exist.UserType == Role.Admin.ToString())
                {
                    var count_superadmins = await context.Users.CountAsync(x => x.UserType == Role.Admin.ToString());
                    if (count_superadmins < 2) return new(false) { Messages = ["Должен быть хотя бы один Суперадмин"] };
                }

                context.Users.Remove(exist);
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
        public async Task<ResponseModel<List<UserModel>>> GetAll()
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var result = await context.Users
                    .AsNoTracking()
                    .OrderByDescending(x => x.Id)
                    .Select(x => _mapper.Map<UserModel>(x))
                    .ToListAsync();
                return new(true) { Data = result };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = [ex.Message, ex.InnerException?.Message] };
            }
        }

        [HttpGet("roles")]
        public List<string> GetRoles()
        {
            return typeof(Role).GetEnumNames().ToList();
        }
    }
}
