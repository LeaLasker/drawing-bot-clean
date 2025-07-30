namespace server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string? Username { get; set; }

        public List<Drawing> Drawings { get; set; } = new();
    }
}
