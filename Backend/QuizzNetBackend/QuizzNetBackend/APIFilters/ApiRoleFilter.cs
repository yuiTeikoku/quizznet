using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace QuizzNetBackend.APIFilters
{
    public class ApiRoleFilter : IActionFilter
    {
        private readonly IConfiguration _config;
        private string[] _roleIds;
        public ApiRoleFilter(string roles, IConfiguration config)
        {
            _roleIds = roles.Split(',');
            _config = config;
        }
        public void OnActionExecuted(ActionExecutedContext context)
        {
        }

        public void OnActionExecuting(ActionExecutingContext filterContext)
        {
            try
            {
                string? obj = filterContext.HttpContext.Request.Headers["Bearer"];
                if (obj is "" or null) throw new Exception();

                var isValid = ValidateJwt(obj);
                if (!isValid) throw new Exception();

                var token = new JwtSecurityTokenHandler().ReadJwtToken(obj);
                var claims = token.Claims;
                if (claims == null) throw new Exception();

                var userName = claims.FirstOrDefault(x => x.Type == "name");
                if (userName == null) throw new Exception();
                filterContext.HttpContext.Items["userName"] = userName?.Value;

                var role = claims.FirstOrDefault(x => x.Type == "role");
                if (role == null) throw new Exception();
                filterContext.HttpContext.Items["userRole"] = role?.Value;

                var uid = claims.FirstOrDefault(x => x.Type == "uid");
                filterContext.HttpContext.Items["userId"] = uid?.Value;

                if (!_roleIds.Any(roleId => roleId == role?.Value))
                {
                    filterContext.Result = new ForbidResult();
                    return;
                }
            }
            catch
            {
                filterContext.Result = new UnauthorizedResult();
            }
        }

        public bool ValidateJwt(string jwtToken)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? string.Empty));
                var validateParams = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"{_config["Jwt:Issuer"]}",
                    ValidAudience = $"{_config["Jwt:Issuer"]}",
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = securityKey,
                    ValidateAudience = true,
                    ValidateLifetime = true
                };
                SecurityToken? token = null;

                try
                {
                    handler.ValidateToken(jwtToken, validateParams, out token);
                }
                catch
                {
                    return false;
                }

                return true;
            }
            catch
            {
                return false;
            }
        }


    }
}
