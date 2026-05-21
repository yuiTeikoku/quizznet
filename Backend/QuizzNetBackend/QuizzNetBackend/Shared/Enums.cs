namespace QuizzNetBackend.Shared
{
    public enum GameState
    {
        Registry, OnPlay, End
    }

    public enum Role
    {
        User, Admin
    }

    public enum QuestionType
    {
        Text, Image
    }

    public enum AnswerType
    {
        Select, MultiSelect, Text
    }
}
