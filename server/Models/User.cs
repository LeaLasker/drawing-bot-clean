using System.ComponentModel.DataAnnotations;

namespace server.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(120)]
        public string? Username { get; set; }

        [MaxLength(200)]
        public string? Email { get; set; }

        public List<Drawing> Drawings { get; set; } = new();
    }
}
