using System.ComponentModel.DataAnnotations;

namespace server.Models
{
    public class Drawing
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(160)]
        public string? Title { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public int UserId { get; set; }
        public User? User { get; set; }

        public List<DrawingCommand> Commands { get; set; } = new();
    }
}
