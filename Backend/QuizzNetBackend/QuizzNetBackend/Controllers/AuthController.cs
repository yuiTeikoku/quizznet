using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Models;
using QuizzNetBackend.Shared;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace QuizzNetBackend.Controllers
{
    [Route("/auth/")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IDbContextFactory<QuizzContext> _dbContextFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IDbContextFactory<QuizzContext> dbContextFactory, IConfiguration config, ILogger<AuthController> logger)
        {
            _dbContextFactory = dbContextFactory;
            _config = config;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<ResponseModel<string>> Login(NicknamePasswordModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                var crypto = new DetermisticCrypto();
                var encrypted = crypto.Encrypt(model.Password);
                var role = string.Empty;

                
                var user = await context.Users.FirstOrDefaultAsync(x => x.Nickname == model.Nickname && x.Password == encrypted && x.UserType == Role.Admin.ToString());
                if (user != null)
                {
                    user.LastAuth = DateTime.Now;
                    await context.SaveChangesAsync();
                    
                    var claims = new List<Claim>
                    {
                        new Claim("name", user.Nickname),
                        new Claim("uid", user.Id.ToString()),
                        new Claim("role", Role.Admin.ToString()),
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
                    };
                    return new(true) { Data = GetJWT(claims), Success = true };
                }

                return new(false) { Messages = ["Ошибка авторизации"] };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = ["Error endpoint throw exception."] };
            }
        }

        [HttpPost("user")]
        public async Task<ResponseModel<string>> UserLogin(NicknameModel model)
        {
            try
            {
                await using var context = await _dbContextFactory.CreateDbContextAsync();
                
                var user = await context.Users.FirstOrDefaultAsync(x => x.Nickname == model.Nickname && x.UserType == Role.User.ToString());
                if (user == null)
                {
                    user = new User()
                    {
                        Nickname = model.Nickname
                    };
                    await context.Users.AddAsync(user);
                    await context.SaveChangesAsync();
                }
                else if (user.LastAuth > DateTime.Now.AddHours(-6))
                {
                    return new(false) { Messages = ["Пользователь уже был недавно авторизован"] };
                }

                user.LastAuth = DateTime.Now;
                await context.SaveChangesAsync();

                var claims = new List<Claim>
                {
                    new Claim("name", user.Nickname),
                    new Claim("uid", user.Id.ToString()),
                    new Claim("role", Role.User.ToString()),
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
                };
                return new(true) { Data = GetJWT(claims), Success = true };
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message} / {ex.InnerException?.Message} / {ex.StackTrace}");
                return new(false) { Messages = ["Error endpoint throw exception."] };
            }
        }
        
        private string GetJWT(List<Claim> claims)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? string.Empty));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(_config["Jwt:Issuer"],
                _config["Jwt:Issuer"],
                claims,
                expires: DateTime.Now.AddDays(6),
                signingCredentials: credentials);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class NicknamePasswordModel
    {
        public string Nickname { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class NicknameModel
    {
        public string Nickname { get; set; } = string.Empty;
    }
}
