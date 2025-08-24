using System.ComponentModel.DataAnnotations;

namespace server.Models
{
    public class DrawingCommand
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(32)]
        public string Shape { get; set; } = string.Empty; // circle | rect | line | triangle | text

        [MaxLength(40)]
        public string? Color { get; set; }

        // Common
        public float X { get; set; }
        public float Y { get; set; }

        // Circle
        public float? Radius { get; set; }

        // Rect
        public float? Width { get; set; }
        public float? Height { get; set; }

        // Line / Triangle
        public float? X1 { get; set; }
        public float? Y1 { get; set; }
        public float? X2 { get; set; }
        public float? Y2 { get; set; }
        public float? X3 { get; set; }
        public float? Y3 { get; set; }

        // Optional styling / text
        public int? LineWidth { get; set; }
        public string? Text { get; set; }
        public string? Font { get; set; }

        // FK to Drawing
        [Required]
        public int DrawingId { get; set; }
        public Drawing? Drawing { get; set; }
    }
}
