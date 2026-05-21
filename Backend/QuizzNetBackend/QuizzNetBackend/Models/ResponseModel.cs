namespace QuizzNetBackend.Models
{
    public class ResponseModel<T>
    {
        public ResponseModel(bool success)
        {
            Success = success;
        }

        public bool Success { get; set; }

        public T? Data { get; set; }

        public List<string?> Messages { get; set; } = new();
    }

    public class ResponseModel
    {
        public ResponseModel(bool success)
        {
            Success = success;
        }

        public bool Success { get; set; }

        public List<string?> Messages { get; set; } = new();
    }
}
