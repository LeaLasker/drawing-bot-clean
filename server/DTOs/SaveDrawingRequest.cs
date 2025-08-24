namespace server.DTOs
{
    public class SaveDrawingRequest
    {
        public string Email { get; set; } = string.Empty;
        public string? Title { get; set; }
        public List<SaveDrawingCommand> Commands { get; set; } = new();
    }

    public class SaveDrawingCommand
    {
        public string Shape { get; set; } = string.Empty;
        public string? Color { get; set; }
        public float X { get; set; }
        public float Y { get; set; }
        public float? Radius { get; set; }
        public float? Width { get; set; }
        public float? Height { get; set; }
        public float? X1 { get; set; }
        public float? Y1 { get; set; }
        public float? X2 { get; set; }
        public float? Y2 { get; set; }
        public float? X3 { get; set; }
        public float? Y3 { get; set; }
        public int? LineWidth { get; set; }
        public string? Text { get; set; }
        public string? Font { get; set; }
    }
}
