
using AutoMapper;
using QuizzNetBackend.Dbo.Models;
using QuizzNetBackend.Models.Game;
using QuizzNetBackend.Models.Questions;
using QuizzNetBackend.Models.Quizz;
using QuizzNetBackend.Models.Users;
using QuizzNetBackend.Models.UsersGame;
using System.Reflection;

namespace QuizzNetBackend.Mapper
{
    public class MapperProfile: Profile
    {
        public MapperProfile()
        {
            CreateMap<AddUserModel, User>().ForAllMembers(ReplaceIfSourceNotNull<AddUserModel, User>());
            CreateMap<UpdateUserModel, User>().ForAllMembers(ReplaceIfSourceNotNull<UpdateUserModel, User>());
            CreateMap<User, UserModel>();

            CreateMap<AddGameModel, Game>().ForAllMembers(ReplaceIfSourceNotNull<AddGameModel, Game>());
            CreateMap<UpdateGameModel, Game>().ForAllMembers(ReplaceIfSourceNotNull<UpdateGameModel, Game>());
            CreateMap<Game, GameModel>();

            CreateMap<AddQuestionModel, Question>().ForAllMembers(ReplaceIfSourceNotNull<AddQuestionModel, Question>());
            CreateMap<AddQuestionModel, QuestionModel>().ForAllMembers(ReplaceIfSourceNotNull<AddQuestionModel, QuestionModel>());
            CreateMap<UpdateQuestionModel, Question>().ForAllMembers(ReplaceIfSourceNotNull<UpdateQuestionModel, Question>());
            CreateMap<Question, QuestionModel>();

            CreateMap<AddQuizzModel, Quizz>().ForAllMembers(ReplaceIfSourceNotNull<AddQuizzModel, Quizz>());
            CreateMap<AddQuizzModel, QuizzModel>().ForAllMembers(ReplaceIfSourceNotNull<AddQuizzModel, QuizzModel>());
            CreateMap<UpdateQuizzModel, Quizz>().ForAllMembers(ReplaceIfSourceNotNull<UpdateQuizzModel, Quizz>());
            
            CreateMap<Quizz, QuizzModel>();
            CreateMap<UsersGame, UsersGameModel>();
        }

        private static Action<IMemberConfigurationExpression<T1, T2, object>> ReplaceIfSourceNotNull<T1, T2>()
        {
            return opt =>
            {
                var destMember = opt.DestinationMember;
                var sourceMember = typeof(T1).GetProperty(destMember.Name) ?? (MemberInfo)typeof(T1).GetField(destMember.Name);
                if (sourceMember == null) return; 
                opt.PreCondition((src, dest, context) =>
                {
                    var sourceValue = sourceMember switch
                    {
                        PropertyInfo pi => pi.GetValue(src),
                        FieldInfo fi => fi.GetValue(src),
                        _ => null
                    };

                    if (sourceValue == null)
                        return false;
                    
                    if (sourceValue is DateTime dt && dt == DateTime.MinValue)
                        return false;

                    return true;
                });
            };
        }
    }
}
