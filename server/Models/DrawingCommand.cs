namespace server.Models
{
    public class DrawingCommand
    {
        public int Id { get; set; }
        public string? Shape { get; set; }
        public string? Color { get; set; }
        public float X { get; set; }
        public float Y { get; set; }
        public float? Radius { get; set; }
        public float? Width { get; set; }
        public float? Height { get; set; }

        public int DrawingId { get; set; }
        public Drawing? Drawing { get; set; }
    }
}
