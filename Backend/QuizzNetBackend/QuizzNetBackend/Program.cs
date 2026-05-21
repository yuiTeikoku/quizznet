using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Hubs;
using QuizzNetBackend.Mapper;
using QuizzNetBackend.Services;
using QuizzNetBackend.Services.Scoped;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes.Add("Bearer", new OpenApiSecurityScheme
        {
            Name = "Bearer",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

        var requirement = new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecuritySchemeReference("Bearer", document),
                new List<string>()
            }
        };

        document.Security ??= new List<OpenApiSecurityRequirement>();
        document.Security.Add(requirement);

        return Task.CompletedTask;
    });
});

// mapper
builder.Services.AddAutoMapper(cfg => {
    cfg.AddProfile<MapperProfile>();
});

// postgres
builder.Services.AddDbContextFactory<QuizzContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnectionString")));

// hub to client connect token
builder.Services.AddAuthentication("Bearer")
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuers = [builder.Configuration["Jwt:Issuer"]],
        ValidateAudience = true,
        ValidAudiences = [builder.Configuration["Jwt:Issuer"]],
        ValidateLifetime = true,
        IssuerSigningKeys = [new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))],
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/quizzhub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.MaximumReceiveMessageSize = 102400; // 100KB
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://10.65.65.235:3000")  
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();                   
    });
});

builder.Services.AddScoped<PlayGameLogicService>();


var app = builder.Build();
// if (app.Environment.IsDevelopment())
// {
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "v1");
    });
// }

app.UseAuthorization();

app.MapControllers();

app.UseCors("AllowAll");

app.MapHub<QuizzHub>("/quizzhub");

app.Run();
